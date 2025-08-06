import { Router, Request, Response } from 'express';
import { run } from '@openai/agents';
import { greetingAgent, trendyolRestaurantAgent } from '../../agents';
import { v4 as uuidv4 } from 'uuid';
import type { AgentInputItem } from '@openai/agents';
import {
  ConversationModel,
  IConversationMessage,
} from '../../models/conversation.model';
import { optionalAuth } from '../../middleware/auth';

const router = Router();

// Helper function to generate conversation title from first message
const generateConversationTitle = (message: string): string => {
  if (!message || message.trim().length === 0) {
    return 'New Conversation';
  }

  const cleanMessage = message.trim();
  if (cleanMessage.length <= 20) {
    return cleanMessage;
  }

  return cleanMessage.substring(0, 20) + '...';
};

// GET user's conversation history endpoint with pagination
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // If not authenticated, return empty array
    if (!req.user) {
      return res.json({
        success: true,
        conversations: [],
        pagination: {
          page,
          limit,
          totalConversations: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
        user: null,
        timestamp: new Date().toISOString(),
      });
    }

    // Find user's conversations
    const totalConversations = await ConversationModel.countDocuments({
      userId: req.user.id,
    });

    const totalPages = Math.ceil(totalConversations / limit);
    const skip = (page - 1) * limit;

    // Get paginated conversations sorted by last activity (newest first)
    const conversations = await ConversationModel.find({
      userId: req.user.id,
    })
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .select('chatId title messages lastActivity createdAt updatedAt');

    // Format response with conversation summaries
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      const firstMessage = conv.messages[0];

      return {
        chatId: conv.chatId,
        title: conv.title || 'Untitled Conversation',
        messageCount: conv.messages.length,
        lastActivity: conv.lastActivity,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        preview: {
          firstMessage: firstMessage
            ? {
                role: firstMessage.role,
                content: firstMessage.content[0]?.text?.substring(0, 100) || '',
                timestamp: firstMessage.timestamp,
              }
            : null,
          lastMessage: lastMessage
            ? {
                role: lastMessage.role,
                content: lastMessage.content[0]?.text?.substring(0, 100) || '',
                timestamp: lastMessage.timestamp,
              }
            : null,
        },
      };
    });

    res.json({
      success: true,
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        totalConversations,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history',
      timestamp: new Date().toISOString(),
    });
  }
});

// Helper function to convert MongoDB messages to AgentInputItem format
const convertToAgentInputItems = (
  messages: IConversationMessage[]
): AgentInputItem[] => {
  return messages.map((msg) => {
    if (msg.role === 'user') {
      // Convert to proper user input format
      const inputContent = msg.content
        .filter((item) => item.type === 'input_text')
        .map((item) => ({
          type: 'input_text' as const,
          text: item.text,
          providerData: item.providerData,
        }));
      return {
        role: 'user',
        content: inputContent,
      };
    } else if (msg.role === 'assistant') {
      // Convert to proper assistant output format
      const outputContent = msg.content
        .filter((item) => item.type === 'output_text')
        .map((item) => ({
          type: 'output_text' as const,
          text: item.text,
          providerData: item.providerData,
        }));
      return {
        role: 'assistant',
        content: outputContent,
        status: msg.status || 'completed',
      };
    }
    // Handle system messages if needed
    return {
      role: 'system',
      content: msg.content[0]?.text || '',
    };
  });
};

// Streaming chat endpoint with greetingAgent
router.post('/stream', optionalAuth, async (req: Request, res: Response) => {
  const { message, location, selectedTool, chatId } = req.body;

  // Use authenticated user's ID if available, otherwise fallback to request body userId or null
  const userId = req.user?.id || req.body.userId || null;

  // Handle conversation threading with MongoDB
  let currentChatId = chatId;
  let thread: AgentInputItem[] = [];
  let conversation;

  try {
    if (!currentChatId) {
      // New conversation - generate UUID
      currentChatId = uuidv4();
      thread = [];
      console.log('🆕 New conversation started:', currentChatId);

      // Create new conversation document
      conversation = new ConversationModel({
        chatId: currentChatId,
        messages: [],
      });
    } else {
      // Existing conversation - load from MongoDB
      conversation = await ConversationModel.findOne({ chatId: currentChatId });
      if (conversation) {
        thread = convertToAgentInputItems(conversation.messages);
        console.log(
          '🔄 Continuing conversation:',
          currentChatId,
          `(${thread.length} messages)`
        );
      } else {
        // ChatId provided but not found, create new one with the provided ID
        conversation = new ConversationModel({
          chatId: currentChatId,
          messages: [],
        });
        console.log(
          '🔄 Creating conversation with provided chatId:',
          currentChatId
        );
      }
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load conversation',
      timestamp: new Date().toISOString(),
    });
  }

  // Determine which agent to use and prepare the message
  const isRestaurantRequest =
    selectedTool === 'restaurants' || selectedTool === 'restaurant';
  const selectedAgent = isRestaurantRequest
    ? trendyolRestaurantAgent
    : greetingAgent;
  const agentName = isRestaurantRequest
    ? 'trendyolRestaurantAgent'
    : 'greetingAgent';

  // Log the received context for debugging
  console.log('📨 Received request:', {
    message: message?.substring(0, 50) + (message?.length > 50 ? '...' : ''),
    location: location ? 'provided' : 'not provided',
    selectedTool: selectedTool || 'general',
    chatId: currentChatId,
    userId: userId || 'anonymous',
    authenticated: !!req.user,
    userEmail: req.user?.email || 'none',
    threadLength: thread.length,
    agent: agentName,
  });

  // Set headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'X-Accel-Buffering': 'no',
  });

  let streamActive = true;

  // Handle client disconnect (but don't break immediately)
  req.on('close', () => {
    console.log(
      '⚠️ Client connection closed - but continuing agent processing'
    );
    // Don't set streamActive = false immediately, let the agent finish
  });

  req.on('aborted', () => {
    console.log('⚠️ Client connection aborted');
    streamActive = false;
  });

  // Prepare message with location data for all agents
  let finalMessage = message || 'Merhaba';
  if (location) {
    finalMessage += `\n\nKullanıcının konumu: ${JSON.stringify(location)}`;
  }

  try {
    // Send initial connection event with conversation ID
    res.write(
      `data: ${JSON.stringify({
        type: 'start',
        content: '',
        tool: selectedTool || 'general',
        agent: agentName,
        chatId: currentChatId,
        isNewConversation: !chatId,
      })}\n\n`
    );

    // Add user message to thread and save to conversation
    if (message) {
      const userMessage: IConversationMessage = {
        role: 'user',
        content: [{ type: 'input_text', text: message }], // Store original message without location
        timestamp: new Date(),
      };

      // Add to thread for agent processing (with location)
      thread.push({
        role: 'user',
        content: [{ type: 'input_text', text: finalMessage }], // Send finalMessage (with location) to agent
      });

      // Save user message to MongoDB using upsert
      try {
        const existingConversation = await ConversationModel.findOne({
          chatId: currentChatId,
        });
        const isFirstMessage =
          !existingConversation || existingConversation.messages.length === 0;

        const updateData: Record<string, unknown> = {
          $push: { messages: userMessage },
          $set: { lastActivity: new Date() },
          $setOnInsert: { userId: userId || null },
        };

        // Set title only for the first message
        if (isFirstMessage) {
          (updateData.$setOnInsert as any).title =
            generateConversationTitle(message);
        }

        await ConversationModel.findOneAndUpdate(
          { chatId: currentChatId },
          updateData,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      } catch (saveError) {
        console.error('Error saving user message to MongoDB:', saveError);
      }
    }

    console.log(
      `🚀 Starting ${agentName} with message:`,
      finalMessage?.substring(0, 100) +
        (finalMessage?.length > 100 ? '...' : ''),
      'Thread length:',
      thread.length,
      'Location provided:',
      !!location
    );

    const result = await run(
      selectedAgent,
      thread.length > 0 ? thread : finalMessage,
      {
        stream: true,
      }
    );
    console.log('🎯 Agent run initiated, starting event loop...');

    // Process agent stream events and capture response
    let eventCount = 0;
    let agentResponse = '';

    for await (const event of result) {
      eventCount++;
      console.log(`📦 Event #${eventCount}:`, event.type);

      // Only break if client explicitly aborted, not just closed
      if (!streamActive) {
        console.log('❌ Stream aborted by client, breaking...');
        break;
      }

      try {
        // Handle raw model stream events (text deltas)
        if (event.type === 'raw_model_stream_event') {
          console.log(`${event.type}:`, event.data);

          if (event.data.type === 'output_text_delta') {
            // Capture agent response for conversation history
            agentResponse += event.data.delta;

            res.write(
              `data: ${JSON.stringify({
                type: 'word',
                content: event.data.delta,
                tool: selectedTool || 'general',
                agent: agentName,
                chatId: currentChatId,
              })}\n\n`
            );
            // Force flush if available
            if ('flush' in res && typeof res.flush === 'function') {
              res.flush();
            }
          } else if (event.data.type === 'response_started') {
            console.log('✅ Agent response started');
            res.write(
              `data: ${JSON.stringify({
                type: 'agent_started',
                tool: selectedTool || 'general',
                agent: 'greetingAgent',
              })}\n\n`
            );
            if ('flush' in res && typeof res.flush === 'function') {
              res.flush();
            }
          } else if (event.data.type === 'response_done') {
            console.log('✅ Agent response finished');
          }
        }

        // Handle agent updated events
        if (event.type === 'agent_updated_stream_event') {
          console.log(`${event.type}: ${event.agent.name}`);
          res.write(
            `data: ${JSON.stringify({
              type: 'agent_update',
              agent: event.agent.name,
              tool: selectedTool || 'general',
            })}\n\n`
          );
          if ('flush' in res && typeof res.flush === 'function') {
            res.flush();
          }
        }

        // Handle run item stream events (handoffs, tool calls, etc.)
        if (event.type === 'run_item_stream_event') {
          console.log(`${event.type}:`);
          res.write(
            `data: ${JSON.stringify({
              type: 'run_item',
              item: event.item,
              tool: selectedTool || 'general',
            })}\n\n`
          );
          if ('flush' in res && typeof res.flush === 'function') {
            res.flush();
          }
        }
      } catch (eventError) {
        console.error('Error processing event:', eventError);
      }
    }

    console.log(
      `🏁 Agent stream completed. Total events processed: ${eventCount}`
    );

    // Add agent response to conversation and save to MongoDB
    if (agentResponse.trim()) {
      const assistantMessage: IConversationMessage = {
        role: 'assistant',
        content: [{ type: 'output_text', text: agentResponse.trim() }],
        status: 'completed',
        timestamp: new Date(),
      };

      // Use upsert to avoid duplicate key errors
      try {
        await ConversationModel.findOneAndUpdate(
          { chatId: currentChatId },
          {
            $push: { messages: assistantMessage },
            $set: { lastActivity: new Date() },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
        console.log(`💾 Conversation saved to MongoDB: ${currentChatId}`);
      } catch (saveError) {
        console.error('Error saving conversation to MongoDB:', saveError);
      }
    }

    // Send completion signal
    if (streamActive) {
      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          content: '',
          tool: selectedTool || 'general',
          agent: agentName,
          chatId: currentChatId,
          threadLength: conversation.messages.length,
        })}\n\n`
      );
    }
  } catch (error) {
    console.error(`Error with ${agentName}:`, error);

    // Send error response if agent fails
    if (streamActive) {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          content:
            'VatandaşGPT şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
          tool: selectedTool || 'general',
          error: true,
        })}\n\n`
      );

      res.write(
        `data: ${JSON.stringify({
          type: 'complete',
          content: '',
          tool: selectedTool || 'general',
          error: true,
        })}\n\n`
      );
    }
  }

  res.end();
});

// Regular chat endpoint (for fallback)
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const { message, location, selectedTool, chatId } = req.body;

  // Use authenticated user's ID if available, otherwise fallback to request body userId or null
  const userId = req.user?.id || req.body.userId || null;

  // Handle conversation threading with MongoDB for regular endpoint
  let currentChatId = chatId;
  let thread: AgentInputItem[] = [];
  let conversation;

  try {
    if (!currentChatId) {
      // New conversation - generate UUID
      currentChatId = uuidv4();
      thread = [];
      // Create new conversation document
      conversation = new ConversationModel({
        chatId: currentChatId,
        messages: [],
      });
    } else {
      // Existing conversation - load from MongoDB
      conversation = await ConversationModel.findOne({ chatId: currentChatId });
      if (conversation) {
        thread = convertToAgentInputItems(conversation.messages);
      } else {
        // ChatId provided but not found, create new one with the provided ID
        conversation = new ConversationModel({
          chatId: currentChatId,
          messages: [],
        });
      }
    }
  } catch (error) {
    console.error('Error loading conversation for regular endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load conversation',
      timestamp: new Date().toISOString(),
    });
  }

  // Log the fallback request
  console.log('📨 Regular request:', {
    message: message?.substring(0, 50) + (message?.length > 50 ? '...' : ''),
    selectedTool: selectedTool || 'general',
    chatId: currentChatId,
    userId: userId || 'anonymous',
    authenticated: !!req.user,
    userEmail: req.user?.email || 'none',
    threadLength: thread.length,
  });

  // Determine which agent to use and prepare the message (same as streaming endpoint)
  const isRestaurantRequest =
    selectedTool === 'restaurants' || selectedTool === 'restaurant';
  const selectedAgent = isRestaurantRequest
    ? trendyolRestaurantAgent
    : greetingAgent;
  const agentName = isRestaurantRequest
    ? 'trendyolRestaurantAgent'
    : 'greetingAgent';

  // Prepare message with location data for all agents
  let finalMessage = message || 'Merhaba';
  if (location) {
    finalMessage += `\n\nKullanıcının konumu: ${JSON.stringify(location)}`;
  }

  try {
    // Add user message to thread and save to conversation
    if (message) {
      const userMessage: IConversationMessage = {
        role: 'user',
        content: [{ type: 'input_text', text: message }], // Store original message without location
        timestamp: new Date(),
      };
      // Add to thread for agent processing (with location)
      thread.push({
        role: 'user',
        content: [{ type: 'input_text', text: finalMessage }], // Send finalMessage (with location) to agent
      });

      // Save user message to MongoDB using upsert
      try {
        const existingConversation = await ConversationModel.findOne({
          chatId: currentChatId,
        });
        const isFirstMessage =
          !existingConversation || existingConversation.messages.length === 0;

        const updateData: Record<string, unknown> = {
          $push: { messages: userMessage },
          $set: { lastActivity: new Date() },
          $setOnInsert: { userId: userId || null },
        };

        // Set title only for the first message (use original message, not with location)
        if (isFirstMessage) {
          (updateData.$setOnInsert as any).title =
            generateConversationTitle(message);
        }

        await ConversationModel.findOneAndUpdate(
          { chatId: currentChatId },
          updateData,
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
      } catch (saveError) {
        console.error(
          'Error saving user message to MongoDB in regular endpoint:',
          saveError
        );
      }
    }

    console.log(
      `🚀 Starting ${agentName} (regular endpoint) with message:`,
      finalMessage,
      'Location provided:',
      !!location,
      'Location data:',
      location
    );

    // Run the selected agent with conversation context
    const result = await run(
      selectedAgent,
      thread.length > 0 ? thread : finalMessage,
      {
        stream: true,
      }
    );

    // Extract the final response
    let responseMessage = '';
    for await (const event of result) {
      if (
        event.type === 'raw_model_stream_event' &&
        event.data.type === 'output_text_delta'
      ) {
        responseMessage += event.data.delta;
      }
    }

    // Add agent response to conversation and save to MongoDB
    let updatedConversation;
    if (responseMessage.trim()) {
      const assistantMessage: IConversationMessage = {
        role: 'assistant',
        content: [{ type: 'output_text', text: responseMessage.trim() }],
        status: 'completed',
        timestamp: new Date(),
      };

      // Use upsert to avoid duplicate key errors
      try {
        updatedConversation = await ConversationModel.findOneAndUpdate(
          { chatId: currentChatId },
          {
            $push: { messages: assistantMessage },
            $set: { lastActivity: new Date() },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          }
        );
        console.log(
          `💾 Regular endpoint - Conversation saved to MongoDB: ${currentChatId} (${updatedConversation.messages.length} messages)`
        );
      } catch (saveError) {
        console.error(
          'Error saving conversation to MongoDB in regular endpoint:',
          saveError
        );
      }
    }

    res.json({
      success: true,
      message:
        responseMessage ||
        "VatandaşGPT'ye hoş geldiniz! Size nasıl yardımcı olabilirim?",
      tool: selectedTool || 'general',
      agent: agentName,
      chatId: currentChatId,
      isNewConversation: !chatId,
      threadLength: updatedConversation?.messages.length || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error with ${agentName} in regular endpoint:`, error);

    // Send error response if agent fails
    res.json({
      success: false,
      message:
        'VatandaşGPT şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
      tool: selectedTool || 'general',
      error: true,
      timestamp: new Date().toISOString(),
    });
  }
});

// GET conversation history endpoint with pagination
router.get('/:chatId', optionalAuth, async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      error:
        'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Find the conversation
    const conversation = await ConversationModel.findOne({ chatId });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        chatId,
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate pagination
    const totalMessages = conversation.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);
    const skip = (page - 1) * limit;

    // Get paginated messages (reverse order for latest first, then slice)
    const messages = conversation.messages
      .slice()
      .reverse()
      .slice(skip, skip + limit)
      .reverse(); // Reverse again to maintain chronological order in the page

    // Format response
    res.json({
      success: true,
      chatId,
      title: conversation.title || 'Untitled Conversation',
      userId: conversation.userId || null,
      pagination: {
        page,
        limit,
        totalMessages,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      messages: messages.map((msg, index) => ({
        id: skip + index + 1,
        role: msg.role,
        content: msg.content,
        status: msg.status,
        timestamp: msg.timestamp,
      })),
      conversation: {
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        lastActivity: conversation.lastActivity,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history',
      chatId,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
