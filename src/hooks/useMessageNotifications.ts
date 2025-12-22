import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { showNotification } from '@/components/ui/NotificationCenter';

export function useMessageNotifications() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('new-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            conversation_id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Don't notify for own messages
          if (newMessage.sender_id === session.user.id) return;

          // Check if this message is in a conversation the user is part of
          const { data: conversation } = await supabase
            .from('chat_conversations')
            .select('user1_id, user2_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;

          const isParticipant =
            conversation.user1_id === session.user.id ||
            conversation.user2_id === session.user.id;

          if (!isParticipant) return;

          // Get sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          showNotification(
            'message',
            sender?.full_name || 'New Message',
            newMessage.content.length > 50
              ? newMessage.content.substring(0, 50) + '...'
              : newMessage.content,
            {
              avatar: sender?.avatar_url || undefined,
            }
          );
        }
      )
      .subscribe();

    // Subscribe to new connections
    const connectionsChannel = supabase
      .channel('new-connections-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
        },
        async (payload) => {
          const newConnection = payload.new as {
            id: string;
            user_id: string;
            connected_user_id: string;
            connected_via: string | null;
          };

          // Only notify the user who received the connection request
          if (newConnection.connected_user_id !== session.user.id) return;

          // Get connector info
          const { data: connector } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, title, company')
            .eq('id', newConnection.user_id)
            .single();

          showNotification(
            'match',
            'New Connection!',
            `${connector?.full_name || 'Someone'} connected with you`,
            {
              avatar: connector?.avatar_url || undefined,
            }
          );
        }
      )
      .subscribe();

    // Subscribe to new matches
    const matchesChannel = supabase
      .channel('new-matches-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          const newMatch = payload.new as {
            id: string;
            user_id: string;
            matched_user_id: string;
            match_score: number | null;
          };

          // Only notify the matched user (not the initiator)
          if (newMatch.matched_user_id !== session.user.id) return;

          // Get match info
          const { data: matchedUser } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMatch.user_id)
            .single();

          const scoreText = newMatch.match_score ? ` (${newMatch.match_score}% match)` : '';

          showNotification(
            'match',
            'New Match Found!',
            `You matched with ${matchedUser?.full_name || 'someone new'}${scoreText}`,
            {
              avatar: matchedUser?.avatar_url || undefined,
            }
          );
        }
      )
      .subscribe();

    // Subscribe to new meetings
    const meetingsChannel = supabase
      .channel('new-meetings-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meetings',
        },
        async (payload) => {
          const newMeeting = payload.new as {
            id: string;
            organizer_id: string;
            attendee_id: string;
            title: string;
            scheduled_at: string;
          };

          // Only notify the attendee (not the organizer)
          if (newMeeting.attendee_id !== session.user.id) return;

          // Get organizer info
          const { data: organizer } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', newMeeting.organizer_id)
            .single();

          const meetingTime = new Date(newMeeting.scheduled_at).toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          showNotification(
            'meeting',
            'Meeting Scheduled',
            `${organizer?.full_name || 'Someone'} scheduled "${newMeeting.title}" for ${meetingTime}`,
            {
              avatar: organizer?.avatar_url || undefined,
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(connectionsChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(meetingsChannel);
    };
  }, [session?.user?.id]);
}
