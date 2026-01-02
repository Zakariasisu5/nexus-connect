import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';
import GlassCard from '@/components/ui/GlassCard';
import NeonButton from '@/components/ui/NeonButton';
import { useChat, Conversation, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    sendMessage,
    loadConversations,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(inputValue);
    if (success) {
      setInputValue('');
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

  const filteredConversations = conversations.filter((conv) =>
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.created_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  const activeConv = conversations.find((c) => c.id === activeConversation);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold gradient-text">Messages</h1>
          <p className="text-muted-foreground mt-1">Chat with your connections</p>
        </motion.div>

        <GlassCard className="p-0 overflow-hidden h-[calc(100vh-240px)] min-h-[500px]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-border/50 flex flex-col ${
                activeConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Search */}
              <div className="p-4 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl chat-input text-sm"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-muted-foreground">No conversations</h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Connect with matches to start chatting
                    </p>
                    <NeonButton onClick={() => navigate('/matches')} size="sm" className="mt-4">
                      Find Matches
                    </NeonButton>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {filteredConversations.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={activeConversation === conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div
              className={`flex-1 flex flex-col ${
                activeConversation ? 'flex' : 'hidden md:flex'
              }`}
            >
              {activeConversation && activeConv ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border/50 flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img
                      src={
                        activeConv.other_user?.avatar_url ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
                      }
                      alt={activeConv.other_user?.full_name || 'User'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-medium">
                        {activeConv.other_user?.full_name || 'Unknown User'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {activeConv.other_user?.title}
                        {activeConv.other_user?.company && ` at ${activeConv.other_user.company}`}
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
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
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Choose from your conversations to start chatting
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </div>
    </Layout>
  );
};

// Conversation list item
const ConversationItem = ({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) => {
  const formatLastMessage = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <motion.button
      onClick={onClick}
      className={`conversation-item ${isActive ? 'active' : ''}`}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative flex-shrink-0">
        <img
          src={
            conversation.other_user?.avatar_url ||
            'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
          }
          alt={conversation.other_user?.full_name || 'User'}
          className="w-12 h-12 rounded-full object-cover ring-2 ring-border/30"
        />
        {conversation.unread_count && conversation.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 unread-badge">
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate text-foreground">
            {conversation.other_user?.full_name || 'Unknown User'}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatLastMessage(conversation.last_message_at)}
          </span>
        </div>
        <p className={`text-sm truncate mt-0.5 ${conversation.unread_count ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
          {conversation.last_message || 'No messages yet'}
        </p>
      </div>
    </motion.button>
  );
};

// Message bubble
const MessageBubble = ({
  message,
  isOwn,
  time,
}: {
  message: ChatMessage;
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
      <p
        className={`text-[10px] mt-1.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
      >
        {time}
      </p>
    </div>
  </motion.div>
);

export default Messages;
