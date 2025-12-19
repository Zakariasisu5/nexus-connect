import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import AnimatedToast, { Notification, NotificationType } from './AnimatedToast';
import GlassCard from './GlassCard';
import NeonButton from './NeonButton';

// Global notification state
let globalNotifications: Notification[] = [];
let listeners: Set<(notifications: Notification[]) => void> = new Set();

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...globalNotifications]));
};

export const showNotification = (
  type: NotificationType,
  title: string,
  message: string,
  options?: {
    avatar?: string;
    action?: { label: string; onClick: () => void };
  }
) => {
  const notification: Notification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    title,
    message,
    avatar: options?.avatar,
    timestamp: new Date(),
    action: options?.action,
  };

  globalNotifications = [notification, ...globalNotifications].slice(0, 10);
  notifyListeners();
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(globalNotifications);

  useEffect(() => {
    listeners.add(setNotifications);
    return () => {
      listeners.delete(setNotifications);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    globalNotifications = globalNotifications.filter((n) => n.id !== id);
    notifyListeners();
  }, []);

  const clearAll = useCallback(() => {
    globalNotifications = [];
    notifyListeners();
  }, []);

  return { notifications, dismiss, clearAll };
};

// Toast container component
export const NotificationToastContainer = () => {
  const { notifications, dismiss } = useNotifications();
  const visibleToasts = notifications.slice(0, 3);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      <AnimatePresence mode="popLayout">
        {visibleToasts.map((notification) => (
          <AnimatedToast
            key={notification.id}
            notification={notification}
            onDismiss={dismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Bell icon with notification count
interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell = ({ onClick }: NotificationBellProps) => {
  const { notifications } = useNotifications();
  const unreadCount = notifications.length;

  return (
    <motion.button
      onClick={onClick}
      className="relative p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Bell className="w-5 h-5 text-foreground" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
      
      {/* Pulse animation when there are notifications */}
      {unreadCount > 0 && (
        <motion.span
          className="absolute inset-0 rounded-xl border-2 border-primary"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

// Notification panel/dropdown
interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const { notifications, dismiss, clearAll } = useNotifications();

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-16 right-4 z-50 w-80"
          >
            <GlassCard className="p-0 overflow-hidden" glow="primary">
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex gap-3">
                          {notification.avatar && (
                            <img
                              src={notification.avatar}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {formatTime(notification.timestamp)}
                            </p>
                          </div>
                          <button
                            onClick={() => dismiss(notification.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
