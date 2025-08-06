const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Lorem ipsum words pool
const loremWords = [
  'Lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'Ut',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'ut',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'Duis',
  'aute',
  'irure',
  'dolor',
  'in',
  'reprehenderit',
  'in',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'dolore',
  'eu',
  'fugiat',
  'nulla',
  'pariatur',
  'Excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'in',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'Sed',
  'ut',
  'perspiciatis',
  'unde',
  'omnis',
  'iste',
  'natus',
  'error',
  'sit',
  'voluptatem',
  'accusantium',
  'doloremque',
  'laudantium',
  'totam',
  'rem',
  'aperiam',
  'eaque',
  'ipsa',
  'quae',
  'ab',
  'illo',
  'inventore',
  'veritatis',
  'et',
  'quasi',
  'architecto',
  'beatae',
  'vitae',
  'dicta',
  'sunt',
  'explicabo',
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Tool-specific response generators
const getToolSpecificWords = (tool) => {
  const toolWords = {
    general: [
      'Hello',
      'I',
      'can',
      'help',
      'you',
      'with',
      'anything',
      'you',
      'need',
    ],
    property: [
      'Beautiful',
      'apartment',
      'available',
      'near',
      'city',
      'center',
      'with',
      'modern',
      'amenities',
    ],
    cars: [
      'Premium',
      'vehicle',
      'available',
      'for',
      'rent',
      'excellent',
      'condition',
      'competitive',
      'prices',
    ],
    news: [
      'Breaking',
      'news',
      'today',
      'important',
      'developments',
      'in',
      'local',
      'and',
      'international',
    ],
    restaurants: [
      'Delicious',
      'cuisine',
      'nearby',
      'restaurants',
      'excellent',
      'reviews',
      'great',
      'atmosphere',
      'perfect',
    ],
  };

  return toolWords[tool] || toolWords.general;
};

// Streaming chat endpoint
app.post('/api/chat/stream', async (req, res) => {
  const { message, location, selectedTool, chatId } = req.body;

  // Log the received context for debugging
  console.log('📨 Received request:', {
    message: message?.substring(0, 50) + (message?.length > 50 ? '...' : ''),
    location: location ? 'provided' : 'not provided',
    selectedTool: selectedTool || 'general',
    chatId: chatId || 'new chat',
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

  // Get tool-specific words and generate response length
  const toolWords = getToolSpecificWords(selectedTool || 'general');
  const responseLength = Math.min(Math.max(8, toolWords.length), 15);

  // Generate chatId if not provided
  const currentChatId = chatId || `c${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const isNewChat = !chatId;

  // Send initial connection event with tool context and chatId
  res.write(
    `data: ${JSON.stringify({
      type: 'start',
      content: '',
      total: responseLength,
      tool: selectedTool || 'general',
      agent: 'greetingAgent',
      chatId: currentChatId,
      isNewChat: isNewChat,
    })}\n\n`
  );

  // Brief delay to establish connection
  await new Promise((resolve) => setTimeout(resolve, 50));

  let streamActive = true;

  // Handle client disconnect
  req.on('close', () => {
    streamActive = false;
  });

  req.on('aborted', () => {
    streamActive = false;
  });

  // Stream words with 100ms intervals
  for (
    let wordIndex = 0;
    wordIndex < responseLength && streamActive;
    wordIndex++
  ) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (!streamActive) break;

    try {
      // Use tool-specific words in order, with fallback to lorem words
      const word =
        wordIndex < toolWords.length
          ? toolWords[wordIndex]
          : loremWords[Math.floor(Math.random() * loremWords.length)];

      const eventData = {
        type: 'word',
        content: word,
        index: wordIndex,
        isLast: wordIndex === responseLength - 1,
        tool: selectedTool || 'general',
      };

      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    } catch (error) {
      console.error('Error streaming word:', error);
      break;
    }
  }

  // Send completion signal
  if (streamActive) {
    try {
      const completionData = {
        type: 'complete',
        content: '',
        index: responseLength,
        isLast: true,
        tool: selectedTool || 'general',
      };

      res.write(`data: ${JSON.stringify(completionData)}\n\n`);
    } catch (error) {
      console.error('Error sending completion:', error);
    }
  }

  res.end();
});

// Regular chat endpoint (for fallback)
app.post('/api/chat', (req, res) => {
  const { message, location, selectedTool, chatId } = req.body;

  // Log the fallback request
  console.log('📨 Fallback request:', {
    message: message?.substring(0, 50) + (message?.length > 50 ? '...' : ''),
    selectedTool: selectedTool || 'general',
  });

  // Generate tool-specific response
  const toolWords = getToolSpecificWords(selectedTool || 'general');
  const response = toolWords.slice(0, 8).join(' ') + '.';

  res.json({
    success: true,
    message: response,
    tool: selectedTool || 'general',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Vatandaş GPT Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(
    `🌊 Streaming endpoint: http://localhost:${PORT}/api/chat/stream`
  );
});
