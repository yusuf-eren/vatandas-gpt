import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { IoLocationSharp } from "react-icons/io5";
import { MdChat } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import React, { useState, useEffect, useRef } from 'react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  references?: Record<string, Reference>;
}

interface Review {
  placeId: string;
  publishTime: string;
  rating: number;
  originalText: string;
}

interface Reference {
  type: 'location' | 'product' | 'person';
  link: string;
  placeId?: string;
  reviews?: Review[];
}

interface ParsedResponse {
  message: string;
  references: Record<string, Reference>;
}

// Reviews Modal Component
const ReviewsModal = ({ reviews, isOpen, onClose, placeName }: { 
  reviews: Review[]; 
  isOpen: boolean; 
  onClose: () => void;
  placeName: string;
}) => {
  const [visibleReviews, setVisibleReviews] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset visible reviews when modal opens
  useEffect(() => {
    if (isOpen) {
      setVisibleReviews(3);
    }
  }, [isOpen]);

  // Handle scroll to load more reviews
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isNearBottom && visibleReviews < reviews.length) {
      setIsLoading(true);
      
      // Simulate loading delay for better UX
      setTimeout(() => {
        setVisibleReviews(prev => Math.min(prev + 3, reviews.length));
        setIsLoading(false);
      }, 500);
    }
  };

  const currentReviews = reviews.slice(0, visibleReviews);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {placeName} - Yorumlar ({reviews.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <IoClose className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Reviews Content */}
        <div 
          ref={scrollContainerRef}
          className="p-4 overflow-y-auto max-h-[60vh]"
          onScroll={handleScroll}
        >
          {currentReviews.length > 0 ? (
            <div className="space-y-4">
              {currentReviews.map((review, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {review.rating}/5
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(review.publishTime)}
                    </span>
                  </div>
                  {review.originalText && (
                    <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
                      {review.originalText}
                    </p>
                  )}
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              {/* End indicator */}
              {visibleReviews >= reviews.length && reviews.length > 3 && (
                <div className="text-center py-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Tüm yorumlar gösterildi
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Henüz yorum bulunmuyor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Parse JSON content if it's a JSON string
const parseMessageContent = (content: string): { text: string; references: Record<string, Reference> } => {
  try {
    const parsed: ParsedResponse = JSON.parse(content);
    return {
      text: parsed.message || content,
      references: parsed.references || {}
    };
  } catch (error) {
    // If not JSON, return as plain text
    return {
      text: content,
      references: {}
    };
  }
};

// Process and render text with references
const renderMessageWithReferences = (
  text: string, 
  references: Record<string, Reference>,
  onShowReviews: (reviews: Review[], placeName: string) => void
) => {
  // Process the text to replace {key} patterns with placeholders
  let processedText = text;
  
  const referencePattern = /{([^}]+)}/g;
  const matches = [...text.matchAll(referencePattern)];
  
  matches.forEach((match) => {
    const [fullMatch, key] = match;
    const reference = references[key];
    
    if (reference && reference.type === 'location') {
      let replacement = `[LOCATION_${key}]`;
      
      if (reference.reviews && reference.reviews.length > 0) {
        replacement += ` [REVIEWS_${key}]`;
      }
      
      processedText = processedText.replace(fullMatch, replacement);
    }
    else if (reference) {
      processedText = processedText.replace(fullMatch, '');
    }
  });

  // Split the entire processed text by our placeholders and create React elements
  const parts = processedText.split(/(\[(?:LOCATION|REVIEWS)_[^\]]+\])/);
  
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-gray dark:prose-gray">
      {parts.map((part, index) => {
        const locationMatch = part.match(/^\[LOCATION_([^\]]+)\]$/);
        const reviewsMatch = part.match(/^\[REVIEWS_([^\]]+)\]$/);
        
        if (locationMatch) {
          const key = locationMatch[1];
          const reference = references[key];
          
          if (reference) {
            return (
              <a
                key={index}
                href={reference.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors align-middle"
                title={`${key} konumu`}
              >
                <IoLocationSharp className="w-5 h-5" />
              </a>
            );
          }
        }
        
        if (reviewsMatch) {
          const key = reviewsMatch[1];
          const reference = references[key];
          
          if (reference?.reviews && reference.reviews.length > 0) {
            return (
              <button
                key={index}
                onClick={() => onShowReviews(reference.reviews!, key)}
                className="inline-flex items-center justify-center ml-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors align-middle"
                title={`${key} yorumları`}
              >
                <MdChat className="w-5 h-5" />
              </button>
            );
          }
        }
        
        // Regular text - render with ReactMarkdown
        if (part && !locationMatch && !reviewsMatch) {
          return (
            <ReactMarkdown
              key={index}
              components={{
                h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{children}</h1>,
                h2: ({children}) => <h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{children}</h2>,
                h3: ({children}) => <h3 className="text-base font-bold mb-2 text-gray-900 dark:text-white">{children}</h3>,
                ul: ({children}) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="text-gray-900 dark:text-white">{children}</li>,
                p: ({children}) => (
                  <p className="mb-3 last:mb-0 text-gray-900 dark:text-white leading-relaxed">
                    {children}
                  </p>
                ),
                strong: ({children}) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
                em: ({children}) => <em className="italic text-gray-900 dark:text-white">{children}</em>,
                code: ({children}) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-white">{children}</code>,
                pre: ({children}) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                a: ({children, href}) => (
                  <a 
                    href={href} 
                    className="inline-block text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 no-underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {part}
            </ReactMarkdown>
          );
        }
        
        return null;
      })}
    </div>
  );
};

const ChatMessage = ({ message, isUser, timestamp, references = {} }: ChatMessageProps) => {
  const [selectedReviews, setSelectedReviews] = useState<Review[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = useState<string>('');
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

  const handleShowReviews = (reviews: Review[], placeName: string) => {
    setSelectedReviews(reviews);
    setSelectedPlaceName(placeName);
    setIsReviewsModalOpen(true);
  };

  const handleCloseReviews = () => {
    setIsReviewsModalOpen(false);
    setSelectedReviews([]);
    setSelectedPlaceName('');
  };

  // Use the passed references instead of parsing the content
  const processedContent = renderMessageWithReferences(message, references, handleShowReviews);

  return (
    <>
      <div className={cn(
        "flex mb-8",
        isUser ? "justify-end" : "justify-start"
      )}>
        <div className={cn(
          "relative rounded-3xl",
          isUser 
            ? 'max-w-[70%] px-5 py-2.5 text-gray-900 dark:text-black bg-[#e9eaec] dark:bg-white'
            : 'w-full p-3 text-gray-900 dark:text-white'
        )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message}</div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-gray dark:prose-gray">
              {processedContent}
            </div>
          )}
        </div>
      </div>

      <ReviewsModal 
        reviews={selectedReviews}
        isOpen={isReviewsModalOpen}
        onClose={handleCloseReviews}
        placeName={selectedPlaceName}
      />
    </>
  );
};

export default ChatMessage;
