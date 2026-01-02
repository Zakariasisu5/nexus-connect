import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { useChat, Conversation } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import GlassCard from './GlassCard';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialUserId?: string;
  initialUserName?: string;
  onOpen?: () => void;
}

const ChatPanel = ({ isOpen, onClose, initialUserId, initialUserName, onOpen }: ChatPanelProps) => {
  const { session } = useAuth();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    startConversation,
    sendMessage,
  } = useChat();
  
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-start conversation if initialUserId is provided
  useEffect(() => {
    if (isOpen && initialUserId && !activeConversation) {
      startConversation(initialUserId);
    }
  }, [isOpen, initialUserId, activeConversation, startConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    
    setSending(true);
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
      // Close panel after successful send so users can continue without the panel
      if (onClose) onClose();
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, typeof messages>);

  return (
    <>
      {/* Floating button when panel is closed */}
      {!isOpen && (
        <button
          aria-label="Open chat"
          onClick={() => onOpen && onOpen()}
          className="fixed z-40 right-6 bottom-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: '100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-full sm:w-[360px] md:w-[420px] lg:w-[480px] z-50 bg-background/95 backdrop-blur-xl border-l border-border/50 flex flex-col max-h-screen"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            {activeConversation ? (
              <button
                onClick={() => setActiveConversation(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            ) : (
              <h2 className="text-lg font-semibold">Messages</h2>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {!activeConversation ? (
              // Conversations List
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Connect with matches to start chatting</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      onClick={() => setActiveConversation(conv.id)}
                    />
                  ))
                )}
              </div>
            ) : (
              // Messages View
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <div className="flex items-center justify-center my-4">
                        <span className="date-separator">
                          {date}
                        </span>
                      </div>
                      {msgs.map((message) => (
                        <MessageBubble
                          key={message.id}
                          message={message}
                          isOwn={message.sender_id === session?.user?.id}
                          time={formatTime(message.created_at)}
                        />
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/50 bg-card/80 backdrop-blur-sm">
                  <div className="flex gap-3 items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 chat-input"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || sending}
                      className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
};

// Conversation list item
const ConversationItem = ({
  conversation,
  onClick,
}: {
  conversation: Conversation;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    className="w-full p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors flex items-center gap-3 text-left"
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    <img
      src={conversation.other_user?.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
      alt={conversation.other_user?.full_name || 'User'}
      className="w-12 h-12 rounded-full object-cover"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="font-medium truncate">
          {conversation.other_user?.full_name || 'Unknown User'}
        </h3>
        {conversation.unread_count && conversation.unread_count > 0 && (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
            {conversation.unread_count}
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground truncate">
        {conversation.last_message || 'No messages yet'}
      </p>
    </div>
  </motion.button>
);

// Message bubble
const MessageBubble = ({
  message,
  isOwn,
  time,
}: {
  message: { content: string };
  isOwn: boolean;
  time: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.2 }}
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
  >
    <div
      className={`max-w-[75%] px-4 py-3 ${
        isOwn ? 'message-bubble-own' : 'message-bubble-other'
      }`}
    >
      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      <p className={`text-[10px] mt-1.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
        {time}
      </p>
    </div>
  </motion.div>
);

export default ChatPanel;
