import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Match {
  id: string;
  matched_user_id: string;
  match_score: number;
  ai_explanation: string;
  confidence_score: number;
  shared_skills: string[];
  shared_interests: string[];
  status: string;
  profile: {
    id: string;
    full_name: string;
    title: string;
    company: string;
    location: string;
    avatar_url: string;
    skills: string[];
    interests: string[];
    bio: string;
  };
}

export function useMatches() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch matches');
      }

      setMatches(data.matches || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch matches';
      setError(message);
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const updateMatchStatus = async (matchId: string, status: 'accepted' | 'rejected') => {
    if (!session) return;

    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);

    if (error) {
      console.error('Error updating match:', error);
      return;
    }

    setMatches(prev => 
      prev.map(m => m.id === matchId ? { ...m, status } : m)
    );
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('matches-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Match update:', payload);
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, fetchMatches]);

  return { matches, loading, error, fetchMatches, updateMatchStatus };
}
