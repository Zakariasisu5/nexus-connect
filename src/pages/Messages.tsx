import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle, Search, ArrowLeft, Check, CheckCheck, MoreVertical, Phone, Video } from 'lucide-react';
import Layout from '@/components/Layout';
import { useChat, Conversation, ChatMessage } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalytics } from '@/hooks/useAnalytics';

const Messages = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get('user');
  const { trackEvent, trackPageView } = useAnalytics();
  
  const {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation,
    sendMessage,
    startConversation,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) {
      navigate('/auth');
    }
  }, [session, navigate]);

  useEffect(() => {
    if (session?.user?.id) {
      trackPageView('messages');
    }
  }, [session?.user?.id, trackPageView]);

  useEffect(() => {
    const initConversation = async () => {
      if (userIdFromUrl && session?.user?.id && !initializing && !loading) {
        if (userIdFromUrl === session.user.id) return;
        
        setInitializing(true);
        const convId = await startConversation(userIdFromUrl);
        if (convId) {
          navigate('/messages', { replace: true });
        }
        setInitializing(false);
      }
    };
    initConversation();
  }, [userIdFromUrl, session?.user?.id, loading, initializing, startConversation, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(inputValue);
    if (success) {
      trackEvent('message_sent', { conversation_id: activeConversation || undefined });
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
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
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
      <div className="max-w-6xl mx-auto h-[calc(100vh-120px)]">
        <div className="bg-card rounded-2xl overflow-hidden h-full shadow-xl border border-border/30">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div
              className={`w-full md:w-[340px] lg:w-[380px] border-r border-border/30 flex flex-col bg-card ${
                activeConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Sidebar Header */}
              <div className="p-4 bg-muted/30">
                <h1 className="text-xl font-bold mb-4">Chats</h1>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search or start new chat"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border-0 focus:ring-2 focus:ring-primary/30 focus:outline-none transition-all text-sm placeholder:text-muted-foreground/70"
                  />
                </div>
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No chats yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Connect with people to start messaging
                    </p>
                    <button
                      onClick={() => navigate('/matches')}
                      className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Find Connections
                    </button>
                  </div>
                ) : (
                  <div>
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
              className={`flex-1 flex flex-col bg-background ${
                activeConversation ? 'flex' : 'hidden md:flex'
              }`}
            >
              {activeConversation && activeConv ? (
                <>
                  {/* Chat Header */}
                  <div className="px-4 py-3 bg-card border-b border-border/30 flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                      <img
                        src={
                          activeConv.other_user?.avatar_url ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${activeConv.other_user?.full_name || 'U'}`
                        }
                        alt={activeConv.other_user?.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {activeConv.other_user?.full_name || 'Unknown User'}
                      </h3>
                      <p className="text-xs text-green-500">online</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <Video className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <Phone className="w-5 h-5" />
                      </button>
                      <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Area - WhatsApp style background */}
                  <div 
                    className="flex-1 overflow-y-auto px-4 py-2"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  >
                    <AnimatePresence>
                      {Object.entries(groupedMessages).map(([date, msgs]) => (
                        <div key={date}>
                          <div className="flex items-center justify-center my-4">
                            <span className="text-xs text-muted-foreground bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                              {date}
                            </span>
                          </div>
                          {msgs.map((message, idx) => (
                            <MessageBubble
                              key={message.id}
                              message={message}
                              isOwn={message.sender_id === session?.user?.id}
                              time={formatTime(message.created_at)}
                              isLast={idx === msgs.length - 1}
                            />
                          ))}
                        </div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 bg-card border-t border-border/30">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 bg-background rounded-3xl border border-border/50 overflow-hidden">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message"
                          className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none text-sm"
                          disabled={sending}
                        />
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sending}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          inputValue.trim()
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Send className={`w-5 h-5 ${inputValue.trim() ? '' : 'opacity-50'}`} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-muted/20">
                  <div className="text-center max-w-sm px-6">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                      <MessageCircle className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">MeetMate Web</h2>
                    <p className="text-muted-foreground">
                      Send and receive messages with your connections. Select a chat to start messaging.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Conversation list item - WhatsApp style
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const hasUnread = conversation.unread_count && conversation.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-muted/50 ${
        isActive ? 'bg-muted/70' : ''
      }`}
    >
      <div className="relative flex-shrink-0">
        <img
          src={
            conversation.other_user?.avatar_url ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${conversation.other_user?.full_name || 'U'}`
          }
          alt={conversation.other_user?.full_name || 'User'}
          className="w-12 h-12 rounded-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 border-b border-border/20 pb-3">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="font-medium text-foreground truncate">
            {conversation.other_user?.full_name || 'Unknown User'}
          </h3>
          <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {formatLastMessage(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate pr-2">
            {conversation.last_message || 'No messages yet'}
          </p>
          {hasUnread && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// Message bubble - WhatsApp style with tail
const MessageBubble = ({
  message,
  isOwn,
  time,
  isLast,
}: {
  message: ChatMessage;
  isOwn: boolean;
  time: string;
  isLast: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.2 }}
    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
  >
    <div className="relative max-w-[75%] sm:max-w-[65%]">
      {/* Message bubble with tail */}
      <div
        className={`relative px-3 py-2 shadow-sm ${
          isOwn
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md'
            : 'bg-card text-foreground rounded-2xl rounded-tl-md border border-border/30'
        }`}
      >
        {/* Tail */}
        <div
          className={`absolute top-0 w-3 h-3 ${
            isOwn
              ? 'right-0 -mr-1.5 bg-primary'
              : 'left-0 -ml-1.5 bg-card border-l border-t border-border/30'
          }`}
          style={{
            clipPath: isOwn
              ? 'polygon(0 0, 100% 0, 0 100%)'
              : 'polygon(100% 0, 0 0, 100% 100%)',
          }}
        />
        
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        
        {/* Time and read status */}
        <div className={`flex items-center justify-end gap-1 mt-1 -mb-0.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          <span className="text-[10px]">{time}</span>
          {isOwn && (
            <span className="text-primary-foreground/70">
              {message.read_at ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export default Messages;
