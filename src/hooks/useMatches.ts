import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface MatchedProfile {
  id: string;
  full_name: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  avatar_url: string | null;
  skills: string[] | null;
  interests: string[] | null;
  bio: string | null;
}

export interface Match {
  id: string;
  matched_user_id: string;
  match_score: number | null;
  ai_explanation: string | null;
  confidence_score: number | null;
  shared_skills: string[] | null;
  shared_interests: string[] | null;
  status: string | null;
  matched_profile?: MatchedProfile;
}

export function useMatches() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing matches from database (no AI call)
  const loadMatches = useCallback(async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('matches')
        .select(`
          id,
          matched_user_id,
          match_score,
          ai_explanation,
          confidence_score,
          shared_skills,
          shared_interests,
          status
        `)
        .eq('user_id', session.user.id)
        .order('match_score', { ascending: false });

      if (dbError) throw dbError;

      // Fetch profiles for matched users and deduplicate by matched_user_id
      if (data && data.length > 0) {
        // Deduplicate: keep highest scoring match per matched_user_id
        const uniqueMatches = new Map<string, typeof data[0]>();
        for (const match of data) {
          const existing = uniqueMatches.get(match.matched_user_id);
          if (!existing || (match.match_score || 0) > (existing.match_score || 0)) {
            uniqueMatches.set(match.matched_user_id, match);
          }
        }
        const deduplicatedData = Array.from(uniqueMatches.values());

        const matchedUserIds = deduplicatedData.map(m => m.matched_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, title, company, location, avatar_url, skills, interests, bio')
          .in('id', matchedUserIds);

        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const matchesWithProfiles = deduplicatedData.map(match => ({
          ...match,
          matched_profile: profileMap.get(match.matched_user_id) as MatchedProfile | undefined
        }));

        setMatches(matchesWithProfiles);
      } else {
        setMatches([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load matches';
      setError(message);
      console.error('Error loading matches:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Generate new matches using AI (only called explicitly)
  const generateMatches = useCallback(async () => {
    if (!session) return { success: false, error: 'Not authenticated' };
    
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
        if (response.status === 429) {
          return { success: false, error: 'AI service is busy. Please wait a moment and try again.' };
        }
        if (response.status === 402) {
          return { success: false, error: 'AI credits depleted. Please try again later.' };
        }
        return { success: false, error: data.error || 'Failed to generate matches' };
      }

      // Reload matches from database after generation
      await loadMatches();
      return { success: true, count: data.matches?.length || 0 };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate matches';
      console.error('Error generating matches:', err);
      return { success: false, error: message };
    }
  }, [session, loadMatches]);

  const updateMatchStatus = async (matchId: string, status: string) => {
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

  // Load matches on mount
  useEffect(() => {
    if (session?.user?.id) {
      loadMatches();
    }
  }, [session?.user?.id, loadMatches]);

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
        () => {
          loadMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, loadMatches]);

  return { matches, loading, error, loadMatches, generateMatches, updateMatchStatus, refreshMatches: loadMatches };
}
