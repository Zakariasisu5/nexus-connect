import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_ai_generated: boolean | null;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_at: string | null;
  created_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    title: string | null;
    company: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

export function useChat() {
  const { session } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get other user IDs
        const otherUserIds = data.map(c => 
          c.user1_id === session.user.id ? c.user2_id : c.user1_id
        );

        // Fetch profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, company')
          .in('id', otherUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Get last messages and unread counts
        const conversationsWithDetails = await Promise.all(
          data.map(async (conv) => {
            const otherId = conv.user1_id === session.user.id ? conv.user2_id : conv.user1_id;
            
            // Get last message
            const { data: lastMsg } = await supabase
              .from('chat_messages')
              .select('content')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .neq('sender_id', session.user.id)
              .is('read_at', null);

            return {
              ...conv,
              other_user: profileMap.get(otherId),
              last_message: lastMsg?.content,
              unread_count: count || 0,
            };
          })
        );

        setConversations(conversationsWithDetails);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!session?.user?.id) return;

    try {
      // First verify the user has access to this conversation
      const { data: convData } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('id', conversationId)
        .single();

      if (!convData) {
        console.error('Conversation not found or access denied');
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', session.user.id)
        .is('read_at', null);

    } catch (err) {
      console.error('Error loading messages:', err);
    }
  }, [session?.user?.id]);

  // Start or get existing conversation with a user
  const startConversation = useCallback(async (otherUserId: string): Promise<string | null> => {
    if (!session?.user?.id) return null;

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .or(`and(user1_id.eq.${session.user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${session.user.id})`)
        .maybeSingle();

      if (existing) {
        setActiveConversation(existing.id);
        await loadMessages(existing.id);
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error } = await supabase
        .from('chat_conversations')
        .insert({
          user1_id: session.user.id,
          user2_id: otherUserId,
        })
        .select()
        .single();

      if (error) throw error;

      setActiveConversation(newConv.id);
      await loadConversations();
      return newConv.id;

    } catch (err) {
      console.error('Error starting conversation:', err);
      return null;
    }
  }, [session?.user?.id, loadMessages, loadConversations]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!session?.user?.id || !activeConversation || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: activeConversation,
          sender_id: session.user.id,
          content: content.trim(),
        });

      if (error) throw error;
      return true;

    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, [session?.user?.id, activeConversation]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel(`messages-${activeConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${activeConversation}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if not from current user
          if (newMessage.sender_id !== session?.user?.id) {
            supabase
              .from('chat_messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, session?.user?.id]);

  // Load conversations on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadConversations();
    }
  }, [session?.user?.id, loadConversations]);

  return {
    conversations,
    activeConversation,
    messages,
    loading,
    setActiveConversation: async (id: string | null) => {
      setActiveConversation(id);
      if (id) await loadMessages(id);
    },
    startConversation,
    sendMessage,
    loadConversations,
  };
}
