import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Mic, 
  Calendar, 
  Share2, 
  Lightbulb,
  Bot,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from './GlassCard';
import { useAIChat } from '@/hooks/useAIChat';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const quickActions = [
  { label: 'Suggest talking points', icon: Lightbulb },
  { label: 'Share my profile', icon: Share2 },
  { label: 'Schedule follow-up', icon: Calendar },
];

export const AIChatbot = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { messages, isTyping, sendMessage } = useAIChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const messageToSend = inputValue;
    setInputValue('');
    await sendMessage(messageToSend);
  };

  const handleQuickAction = (action: string) => {
    if (!session) {
      navigate('/auth');
      return;
    }
    setInputValue(action);
    setTimeout(() => {
      sendMessage(action);
      setInputValue('');
    }, 0);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        aria-label="Open AI assistant"
        title="Open AI assistant"
        className="fixed bottom-4 right-4 z-50 w-12 h-12 sm:bottom-6 sm:right-6 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-primary to-accent shadow-glow-primary flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            '0 0 20px hsl(217 91% 60% / 0.5)',
            '0 0 40px hsl(217 91% 60% / 0.7)',
            '0 0 20px hsl(217 91% 60% / 0.5)',
          ],
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      >
        <Bot className="w-6 h-6 text-white" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop - tapping closes chat */}
            <motion.div
              className="fixed inset-0 z-40 bg-background/80 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 sm:max-w-[calc(100vw-3rem)] sm:rounded-2xl rounded-t-xl mx-auto max-h-[85vh] overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <GlassCard className="p-0 overflow-hidden" hover={false}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 10px hsl(217 91% 60% / 0.3)',
                        '0 0 20px hsl(217 91% 60% / 0.5)',
                        '0 0 10px hsl(217 91% 60% / 0.3)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Bot className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Assistant</h3>
                    <p className="text-xs text-muted-foreground">Always here to help</p>
                  </div>
                </div>
                <motion.button
                  aria-label="Close chat"
                  title="Close chat"
                  className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                    initial={{ opacity: 0, x: message.sender === 'user' ? 20 : -20, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 500, 
                      damping: 30,
                      delay: index * 0.05 
                    }}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground'
                          : 'bg-muted/50 text-foreground border border-border/50'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="bg-muted/50 rounded-2xl px-4 py-3 border border-border/50">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-none">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:border-primary/50 hover:text-primary transition-all whitespace-nowrap"
                    onClick={() => handleQuickAction(action.label)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <action.icon className="w-3 h-3" />
                    {action.label}
                  </motion.button>
                ))}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask me anything..."
                      className="neon-input pr-10"
                    />
                    <motion.button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  </div>
                  <motion.button
                    className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white"
                    onClick={handleSend}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
            </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatbot;
