import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  organizer_id: string | null;
  qr_token: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    title: string | null;
    company: string | null;
    location: string | null;
    bio: string | null;
    skills: string[] | null;
    interests: string[] | null;
  };
}

export function useEvents() {
  const { session } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a secure random token for QR code
  const generateQrToken = (): string => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Load events the user has created (organizer)
  const loadMyEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setMyEvents(data || []);
    } catch (err: any) {
      console.error('Error loading my events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Load events the user is attending
  const loadJoinedEvents = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // Get event IDs user has joined
      const { data: attendees, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', session.user.id);

      if (attendeeError) throw attendeeError;

      if (attendees && attendees.length > 0) {
        const eventIds = attendees.map(a => a.event_id);
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('id', eventIds)
          .order('start_date', { ascending: true });

        if (eventsError) throw eventsError;
        setEvents(eventsData || []);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      console.error('Error loading joined events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Create a new event
  const createEvent = useCallback(async (
    eventData: {
      name: string;
      description?: string;
      location?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Event | null> => {
    if (!session?.user?.id) return null;

    try {
      const qrToken = generateQrToken();
      
      const { data, error: insertError } = await supabase
        .from('events')
        .insert({
          name: eventData.name,
          description: eventData.description || null,
          location: eventData.location || null,
          start_date: eventData.start_date || null,
          end_date: eventData.end_date || null,
          organizer_id: session.user.id,
          qr_token: qrToken,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Also add the organizer as an attendee
      await supabase.from('event_attendees').insert({
        event_id: data.id,
        user_id: session.user.id,
      });

      await loadMyEvents();
      return data;
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message);
      return null;
    }
  }, [session?.user?.id, loadMyEvents]);

  // Get event by QR token (for join page)
  const getEventByToken = useCallback(async (token: string): Promise<Event | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('qr_token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      return data;
    } catch (err: any) {
      console.error('Error fetching event by token:', err);
      return null;
    }
  }, []);

  // Join an event
  const joinEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      // Check if already joined
      const { data: existing } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existing) {
        console.log('Already joined this event');
        return true;
      }

      const { error: insertError } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: session.user.id,
        });

      if (insertError) throw insertError;

      await loadJoinedEvents();
      return true;
    } catch (err: any) {
      console.error('Error joining event:', err);
      setError(err.message);
      return false;
    }
  }, [session?.user?.id, loadJoinedEvents]);

  // Check if user has joined an event
  const hasJoinedEvent = useCallback(async (eventId: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const { data } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      return !!data;
    } catch (err) {
      return false;
    }
  }, [session?.user?.id]);

  // Get event participants
  const getEventParticipants = useCallback(async (eventId: string): Promise<EventParticipant[]> => {
    try {
      const { data: attendees, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (attendeeError) throw attendeeError;

      if (attendees && attendees.length > 0) {
        const userIds = attendees.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, title, company, location, bio, skills, interests')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        return attendees.map(att => ({
          ...att,
          profile: profileMap.get(att.user_id),
        }));
      }

      return [];
    } catch (err: any) {
      console.error('Error loading participants:', err);
      return [];
    }
  }, []);

  // Get event stats for organizer
  const getEventStats = useCallback(async (eventId: string): Promise<{
    participantCount: number;
    connectionCount: number;
  }> => {
    try {
      // Count participants
      const { count: participantCount } = await supabase
        .from('event_attendees')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      // Count connections made at this event
      const { count: connectionCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      return {
        participantCount: participantCount || 0,
        connectionCount: connectionCount || 0,
      };
    } catch (err) {
      return { participantCount: 0, connectionCount: 0 };
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadMyEvents();
      loadJoinedEvents();
    }
  }, [session?.user?.id, loadMyEvents, loadJoinedEvents]);

  return {
    events,
    myEvents,
    loading,
    error,
    createEvent,
    getEventByToken,
    joinEvent,
    hasJoinedEvent,
    getEventParticipants,
    getEventStats,
    loadMyEvents,
    loadJoinedEvents,
  };
}
