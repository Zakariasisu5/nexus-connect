import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  UserPlus, 
  Calendar, 
  MessageSquare, 
  X, 
  Sparkles,
  Clock,
  Check
} from 'lucide-react';

export type NotificationType = 'match' | 'meeting' | 'message' | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface AnimatedToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  duration?: number;
}

const iconMap = {
  match: UserPlus,
  meeting: Calendar,
  message: MessageSquare,
  reminder: Clock,
};

const colorMap = {
  match: 'from-primary to-accent',
  meeting: 'from-accent to-secondary',
  message: 'from-secondary to-primary',
  reminder: 'from-amber-500 to-orange-500',
};

const glowMap = {
  match: 'shadow-glow-primary',
  meeting: 'shadow-glow-accent',
  message: 'shadow-glow-secondary',
  reminder: 'shadow-[0_0_20px_hsl(38_92%_50%_/_0.5)]',
};

const AnimatedToast = ({ notification, onDismiss, duration = 5000 }: AnimatedToastProps) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);
  
  const Icon = iconMap[notification.type];
  const gradientClass = colorMap[notification.type];
  const glowClass = glowMap[notification.type];

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          onDismiss(notification.id);
          return 0;
        }
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [notification.id, onDismiss, duration, isHovered]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl bg-card/95 backdrop-blur-xl border border-border/50 ${glowClass} max-w-sm`}
    >
      {/* Animated gradient background */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradientClass} opacity-10`}
        animate={{
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <div className="relative p-4">
        <div className="flex gap-4">
          {/* Icon with pulse animation */}
          <motion.div
            className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center`}
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {notification.avatar ? (
              <img
                src={notification.avatar}
                alt=""
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              <Icon className="w-6 h-6 text-white" />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <motion.h4
                  className="font-semibold text-foreground truncate"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {notification.title}
                </motion.h4>
                <motion.p
                  className="text-sm text-muted-foreground line-clamp-2"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {notification.message}
                </motion.p>
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {notification.action && (
              <motion.button
                onClick={notification.action.onClick}
                className="mt-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ x: 3 }}
              >
                {notification.action.label}
                <Sparkles className="w-3 h-3" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <motion.div
        className={`h-1 bg-gradient-to-r ${gradientClass}`}
        initial={{ width: '100%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </motion.div>
  );
};

export default AnimatedToast;
