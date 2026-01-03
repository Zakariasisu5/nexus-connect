import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export type AnalyticsEventType = 
  | 'page_view'
  | 'profile_view'
  | 'profile_update'
  | 'match_generated'
  | 'match_accepted'
  | 'match_rejected'
  | 'connection_sent'
  | 'connection_accepted'
  | 'message_sent'
  | 'message_received'
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'meeting_cancelled'
  | 'qr_scan'
  | 'qr_share';

interface EventData {
  page?: string;
  target_user_id?: string;
  match_id?: string;
  meeting_id?: string;
  conversation_id?: string;
  [key: string]: string | number | boolean | undefined;
}

export function useAnalytics() {
  const { session } = useAuth();

  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    eventData: EventData = {},
    eventId?: string
  ) => {
    if (!session?.user?.id) return;

    try {
      const { error } = await supabase.from('analytics_events').insert([{
        user_id: session.user.id,
        event_type: eventType,
        event_data: eventData as Json,
        event_id: eventId ?? undefined,
      }]);

      if (error) {
        console.error('Error tracking analytics event:', error);
      }
    } catch (err) {
      console.error('Error tracking analytics event:', err);
    }
  }, [session?.user?.id]);

  const trackPageView = useCallback((pageName: string) => {
    trackEvent('page_view', { page: pageName });
  }, [trackEvent]);

  return { trackEvent, trackPageView };
}
