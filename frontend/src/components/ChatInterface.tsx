import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';
import InfiniteScrollPrompts from './InfiniteScrollPrompts';
import ToolSelector from './ToolSelector';
import { useChatContext } from '@/contexts/ChatContext';
import api from '@/config/api';
import { AxiosError } from 'axios';

interface Reference {
  type: 'location' | 'product' | 'person';
  link: string;
  placeId?: string;
  reviews?: Array<{
    placeId: string;
    publishTime: string;
    rating: number;
    originalText: string;
  }>;
}

interface ApiMessage {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'developer';
  createdAt?: string;
  updatedAt?: string;
}

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'developer';
  createdAt?: string;
  updatedAt?: string;
  references?: Record<string, Reference>;
}

interface ChatInterfaceProps {
  location: { latitude: number; longitude: number } | null;
  onRequestLocation?: () => void;
}

const ChatInterface = ({ location, onRequestLocation }: ChatInterfaceProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: urlChatId } = useParams<{ id: string }>();
  const { selectedChatId, selectedMessages, resetChat, navigateToChat } =
    useChatContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [chatId, setChatId] = useState<string | null>(urlChatId || null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>('general');
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadingTexts = [
    t('chat.thinking'),
    t('chat.preparingData'),
    t('chat.processing'),
    t('chat.finalStep'),
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    });
  };

  // Enhanced smooth scroll for new messages
  const smoothScrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const targetScrollTop = container.scrollHeight - container.clientHeight;
        const startScrollTop = container.scrollTop;
        const distance = targetScrollTop - startScrollTop;
        const duration = 800; // 800ms animation
        let startTime: number | null = null;

        const animateScroll = (currentTime: number) => {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = Math.min(timeElapsed / duration, 1);

          // Easing function for smooth slow ending (ease-out)
          const easeOut = 1 - Math.pow(1 - progress, 3);

          container.scrollTop = startScrollTop + distance * easeOut;

          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          }
        };

        requestAnimationFrame(animateScroll);
      }
    }
  };

  // Load chat when URL contains chat ID
  useEffect(() => {
    const loadChatFromUrl = async () => {
      if (selectedChatId && selectedChatId !== chatId) {
        try {
          const response = await api.post('/chat/get-chat', {
            id: selectedChatId,
            page: 1,
            limit: 50,
          });

          if (response.data.messages) {
            // Parse content for each message if needed
            const parsedMessages = response.data.messages.map(
              (msg: ApiMessage) => {
                if (msg.role === 'assistant') {
                  let messageContent = msg.content;
                  let messageReferences = {};

                  try {
                    const parsedContent = JSON.parse(messageContent);
                    if (parsedContent.message && parsedContent.references) {
                      messageContent = parsedContent.message;
                      messageReferences = parsedContent.references;
                    }
                  } catch (e) {
                    // If parsing fails, use content as is
                    console.log('Content is not JSON, using as plain text');
                  }

                  return {
                    ...msg,
                    content: messageContent,
                    references: messageReferences,
                  } as Message;
                }
                return msg as Message;
              }
            );

            // Backend already sends messages in chronological order (oldest first)
            setMessages(parsedMessages);
            setChatId(selectedChatId);
            setShowSuggestions(false);
            setCurrentPage(1);
            setHasMoreMessages(response.data.hasMore || false);
            setTimeout(scrollToBottom, 100);
          }
        } catch (error) {
          console.error('Error loading chat from URL:', error);
        }
      }
    };

    loadChatFromUrl();
  }, [selectedChatId, chatId]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!chatId || isLoadingMoreMessages || !hasMoreMessages) return;

    await fetchChatHistory(chatId, currentPage + 1, 10);
  };

  // Handle scroll to load more messages
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;

    // Load more messages when scrolled near the top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMoreMessages) {
      loadMoreMessages();
    }
  };

  // Handle selected conversation from sidebar
  useEffect(() => {
    if (selectedChatId && selectedMessages.length > 0) {
      setChatId(selectedChatId);
      setMessages(selectedMessages);
      setShowSuggestions(false);
      setCurrentPage(1);
      setHasMoreMessages(false); // Sidebar doesn't provide pagination info
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedChatId, selectedMessages]);

  // Handle reset chat (new conversation)
  useEffect(() => {
    if (!selectedChatId && selectedMessages.length === 0) {
      setMessages([]);
      setChatId(null);
      setShowSuggestions(true);
      setCurrentPage(1);
      setHasMoreMessages(false);
    }
  }, [selectedChatId, selectedMessages]);

  useEffect(() => {
    smoothScrollToBottom();
  }, [messages]);

  // Rotate loading texts while loading
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
      }, 2000); // Change text every 2 seconds

      return () => clearInterval(interval);
    } else {
      setLoadingTextIndex(0); // Reset to first text when not loading
    }
  }, [isLoading, loadingTexts.length]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if (!text) return;

    setShowSuggestions(false);

    // Add user message to UI immediately
    const userMessage: Message = {
      _id: Date.now().toString(),
      content: text,
      role: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      _id: assistantMessageId,
      content: '',
      role: 'assistant',
    };

    console.log(
      'Created assistant message with ID:',
      assistantMessageId,
      assistantMessage
    );
    setMessages((prev) => {
      console.log(
        'Adding assistant message to messages. Current count:',
        prev.length
      );
      const newMessages = [...prev, assistantMessage];
      console.log('New messages array:', newMessages);
      return newMessages;
    });

    try {
      // Get JWT token for authorization
      const jwt = localStorage.getItem('jwt');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        }/api/chat/stream`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: text,
            location: location,
            selectedTool: selectedTool,
            ...(chatId && { chatId }),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let streamedContent = '';
      let pendingNavigation: string | null = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          console.log('Raw line received:', line);

          // Handle both 'data: ' prefixed and direct JSON lines
          let data;
          try {
            if (line.startsWith('data: ')) {
              data = JSON.parse(line.slice(6));
            } else if (line.trim() && line.trim().startsWith('{')) {
              data = JSON.parse(line.trim());
            } else {
              continue; // Skip non-JSON lines
            }

            console.log('Received streaming data:', data);

            if (data.type === 'start') {
              // Capture chatId from start event
              if (data.chatId) {
                setChatId(data.chatId);
                // Store navigation for after streaming completes
                if (!urlChatId && data.chatId) {
                  pendingNavigation = data.chatId;
                }
              }
            } else if (data.type === 'word') {
              // Append content as-is without adding spaces
              streamedContent += data.content;
              console.log('Updated streamedContent:', streamedContent);

              // Update the assistant message with streaming content
              setMessages((prev) => {
                console.log('Current messages:', prev);
                console.log(
                  'Looking for assistantMessageId:',
                  assistantMessageId
                );
                const updated = prev.map((msg) => {
                  console.log(
                    'Checking message:',
                    msg._id,
                    'against',
                    assistantMessageId
                  );
                  return msg._id === assistantMessageId
                    ? { ...msg, content: streamedContent }
                    : msg;
                });
                console.log('Updated messages:', updated);
                return updated;
              });
            } else if (data.type === 'run_item') {
              // Handle run_item with message_output_item
              if (
                data.item?.type === 'message_output_item' &&
                data.item?.rawItem?.role === 'assistant'
              ) {
                const content = data.item.rawItem.content;
                if (content && Array.isArray(content)) {
                  const textItem = content.find(
                    (item: { type: string; text?: string }) => item.type === 'output_text'
                  );
                  if (textItem?.text) {
                    console.log(
                      'Complete message from run_item:',
                      textItem.text
                    );
                    // Update the assistant message with the complete content
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg._id === assistantMessageId
                          ? { ...msg, content: textItem.text }
                          : msg
                      )
                    );
                  }
                }
              }
            } else if (data.type === 'complete') {
              console.log('Streaming complete');
              // Streaming complete
              break;
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }

      // Navigate after streaming is complete to avoid component re-mounting
      if (pendingNavigation) {
        console.log('Navigating to:', `/chat/${pendingNavigation}`);
        navigate(`/chat/${pendingNavigation}`, { replace: true });
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Update the assistant message with error
      const errorContent = 'Sorry, I encountered an error. Please try again.';

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === assistantMessageId
            ? { ...msg, content: errorContent }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleToolSelect = (toolId: string) => {
    // For mobile dropdown, always set the selected tool (no toggle to null)
    // For desktop, allow toggle behavior but default to 'general' if deselecting
    if (window.innerWidth < 768) {
      // Mobile: always select the tool
      setSelectedTool(toolId);
    } else {
      // Desktop: toggle behavior, but default to 'general' if deselecting
      setSelectedTool(selectedTool === toolId ? 'general' : toolId);
    }
    setShowToolsDropdown(false);
  };

  // Auto-resize textarea based on content
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Handle input change with auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    autoResizeTextarea();
  };

  // Auto-resize textarea when inputValue changes
  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showToolsDropdown) {
        const target = event.target as Element;
        // Check if the click is outside the dropdown and its trigger button
        const dropdownContainer = target.closest('[data-dropdown-container]');
        if (!dropdownContainer) {
          setShowToolsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showToolsDropdown]);

  // Fetch chat history from backend
  const fetchChatHistory = async (chatId: string, page = 1, limit = 10) => {
    try {
      setIsLoadingMoreMessages(true);
      
      // Get JWT token for authorization
      const jwt = localStorage.getItem('jwt');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (jwt) {
        headers.Authorization = `Bearer ${jwt}`;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        }/api/chat/${chatId}?page=${page}&limit=${limit}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.messages) {
        // Transform messages to match our internal format
        const transformedMessages = data.messages.map((msg: {
          id: number;
          role: string;
          content: Array<{ type: string; text?: string }>;
          timestamp: string;
          status?: string;
        }) => {
          // Extract text content from the content array
          let textContent = '';
          if (msg.content && Array.isArray(msg.content)) {
            const textItem = msg.content.find(
              (item: { type: string; text?: string }) =>
                item.type === 'input_text' || item.type === 'output_text'
            );
            textContent = textItem?.text || '';
          }

          return {
            _id: msg.id.toString(),
            role: msg.role,
            content: textContent,
            timestamp: msg.timestamp,
            status: msg.status || 'completed',
          } as Message;
        });

        if (page === 1) {
          // First page - replace messages (already in chronological order)
          setMessages(transformedMessages);
          setShowSuggestions(false);
        } else {
          // Additional pages - prepend to existing messages
          setMessages((prev) => [...transformedMessages, ...prev]);
        }

        // Update pagination state using new schema
        setHasMoreMessages(data.pagination?.hasNextPage || false);
        setCurrentPage(data.pagination?.page || page);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // Load chat history when chatId is available
  useEffect(() => {
    if (urlChatId) {
      fetchChatHistory(urlChatId, 1, 10);
    }
  }, [urlChatId]);

  // Sync chatId when URL parameter changes
  useEffect(() => {
    if (urlChatId && urlChatId !== chatId) {
      setChatId(urlChatId);
    }
  }, [urlChatId, chatId]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto pb-32 md:pb-32"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && showSuggestions ? (
          <div className="h-full flex flex-col justify-center space-y-6 md:space-y-8 animate-fade-in-up">
            <div className="text-center space-y-3 px-4">
              <h2 className="text-slate-900 dark:text-white text-xl md:text-2xl font-bold">
                {t('chat.discoverPlaces')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                {t('chat.discoverDescription')}
              </p>

              {/* Location Access Button */}
              {!location && onRequestLocation && (
                <div className="mt-4">
                  <Button
                    onClick={onRequestLocation}
                    variant="outline"
                    className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-gray-700"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t('places.enableLocation')}
                  </Button>
                </div>
              )}
            </div>
            <div className="w-full">
              <InfiniteScrollPrompts onPromptSelect={handlePromptSelect} />
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 pb-8">
            {/* Load more messages indicator */}
            {isLoadingMoreMessages && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('common.loading')}</span>
                </div>
              </div>
            )}

            <div className="space-y-4 max-w-4xl mx-auto pb-10">
              {messages.map((message) => (
                <ChatMessage
                  key={message._id}
                  message={message.content}
                  isUser={message.role === 'user'}
                  timestamp={new Date(message.createdAt || Date.now())}
                  references={message.references}
                />
              ))}
              {isLoading && (
                <div className="flex mb-8">
                  <div className="w-full p-3">
                    <div>
                      <p
                        key={loadingTextIndex}
                        className="text-slate-600 dark:text-slate-400 text-sm animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-3 border border-slate-200 dark:border-slate-700"
                      >
                        {loadingTexts[loadingTextIndex]}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Clean Input Area */}
      <div className="absolute bottom-0 md:bottom-4 left-0 right-0 px-4 bg-none dark:bg- w-auto">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl shadow-lg p-3 mb-4 space-y-3"
          >
            {/* Input Row */}
            <div>
              <Textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInputChange}
                placeholder={t('chat.typeMessage')}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && inputValue.trim()) {
                      handleSendMessage();
                    }
                  }
                }}
                className="w-full border-0 bg-transparent focus:ring-0 focus-visible:ring-0 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 text-base outline-none focus:outline-none focus-visible:outline-none resize-none min-h-[24px] max-h-[120px] overflow-y-auto"
                style={{ outline: 'none', boxShadow: 'none' }}
              />
            </div>

            {/* Tools and Send Button Row */}
            <div className="flex items-center justify-between">
              <ToolSelector
                selectedTool={selectedTool}
                onToolSelect={handleToolSelect}
                showDropdown={showToolsDropdown}
                onToggleDropdown={() =>
                  setShowToolsDropdown(!showToolsDropdown)
                }
              />

              {/* Send button */}
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                size="sm"
                className="bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-full h-10 w-10 flex-shrink-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                style={{ outline: 'none', boxShadow: 'none' }}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
