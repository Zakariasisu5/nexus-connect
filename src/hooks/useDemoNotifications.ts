import { useEffect, useRef } from 'react';
import { showNotification } from '@/components/ui/NotificationCenter';

const demoMatches = [
  { name: 'Sarah Chen', role: 'Product Lead at Stripe', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
  { name: 'Marcus Johnson', role: 'CTO at Fintech Co', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
  { name: 'Emily Rodriguez', role: 'Investor at a16z', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
];

const demoMeetings = [
  { name: 'Coffee chat with Alex', time: '2:00 PM' },
  { name: 'Product demo with TechCorp', time: '4:30 PM' },
  { name: 'Networking session', time: '6:00 PM' },
];

export const useDemoNotifications = (enabled: boolean = true) => {
  const hasShownInitial = useRef(false);

  useEffect(() => {
    if (!enabled || hasShownInitial.current) return;
    
    hasShownInitial.current = true;

    // Show initial match notification after 3 seconds
    const matchTimeout = setTimeout(() => {
      const match = demoMatches[Math.floor(Math.random() * demoMatches.length)];
      showNotification(
        'match',
        'New Match Found!',
        `You have a 94% match with ${match.name}`,
        {
          avatar: match.avatar,
          action: {
            label: 'View Profile',
            onClick: () => window.location.href = '/matches',
          },
        }
      );
    }, 3000);

    // Show meeting reminder after 8 seconds
    const meetingTimeout = setTimeout(() => {
      const meeting = demoMeetings[Math.floor(Math.random() * demoMeetings.length)];
      showNotification(
        'reminder',
        'Meeting Reminder',
        `${meeting.name} starts at ${meeting.time}`,
        {
          action: {
            label: 'View Schedule',
            onClick: () => window.location.href = '/schedule',
          },
        }
      );
    }, 8000);

    // Show message notification after 15 seconds
    const messageTimeout = setTimeout(() => {
      const match = demoMatches[Math.floor(Math.random() * demoMatches.length)];
      showNotification(
        'message',
        'New Message',
        `${match.name}: "Great connecting with you!"`,
        {
          avatar: match.avatar,
        }
      );
    }, 15000);

    return () => {
      clearTimeout(matchTimeout);
      clearTimeout(meetingTimeout);
      clearTimeout(messageTimeout);
    };
  }, [enabled]);
};

// Function to trigger notifications manually
export const triggerMatchNotification = (name: string, avatar?: string) => {
  showNotification(
    'match',
    'New Match!',
    `You've been matched with ${name}`,
    {
      avatar,
      action: {
        label: 'Connect Now',
        onClick: () => window.location.href = '/matches',
      },
    }
  );
};

export const triggerMeetingNotification = (title: string, time: string) => {
  showNotification(
    'meeting',
    'Meeting Scheduled',
    `${title} confirmed for ${time}`,
    {
      action: {
        label: 'View Details',
        onClick: () => window.location.href = '/schedule',
      },
    }
  );
};

export const triggerReminderNotification = (title: string, timeUntil: string) => {
  showNotification(
    'reminder',
    'Upcoming Meeting',
    `${title} starts in ${timeUntil}`,
    {
      action: {
        label: 'Join Now',
        onClick: () => window.location.href = '/schedule',
      },
    }
  );
};
