import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type = 'personal', event_id } = await req.json();

    if (type === 'personal') {
      // Personal analytics for attendees
      const [
        { count: totalMatches },
        { count: totalConnections },
        { count: totalMeetings },
        { count: completedMeetings }
      ] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('meetings').select('*', { count: 'exact', head: true }).or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`),
        supabase.from('meetings').select('*', { count: 'exact', head: true })
          .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
          .eq('status', 'completed'),
      ]);

      // Get match score distribution
      const { data: matchScores } = await supabase
        .from('matches')
        .select('match_score')
        .eq('user_id', user.id);

      const avgMatchScore = matchScores?.length 
        ? Math.round(matchScores.reduce((sum, m) => sum + (m.match_score || 0), 0) / matchScores.length)
        : 0;

      // Get activity over time
      const { data: recentActivity } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Group activity by day
      const activityByDay: Record<string, number> = {};
      recentActivity?.forEach(event => {
        const day = new Date(event.created_at).toLocaleDateString('en-US', { weekday: 'short' });
        activityByDay[day] = (activityByDay[day] || 0) + 1;
      });

      return new Response(JSON.stringify({
        metrics: {
          totalMatches: totalMatches || 0,
          totalConnections: totalConnections || 0,
          totalMeetings: totalMeetings || 0,
          completedMeetings: completedMeetings || 0,
          avgMatchScore,
          conversionRate: totalMatches ? Math.round(((totalConnections || 0) / totalMatches) * 100) : 0,
        },
        activityByDay,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type === 'organizer' && event_id) {
      // Check if user is organizer
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['organizer', 'admin'])
        .single();

      if (!userRole) {
        return new Response(JSON.stringify({ error: 'Unauthorized - organizer role required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Event analytics
      const [
        { count: totalAttendees },
        { count: totalMatches },
        { count: totalConnections },
        { count: totalMeetings }
      ] = await Promise.all([
        supabase.from('event_attendees').select('*', { count: 'exact', head: true }).eq('event_id', event_id),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('event_id', event_id),
        supabase.from('connections').select('*', { count: 'exact', head: true }),
        supabase.from('meetings').select('*', { count: 'exact', head: true }).eq('event_id', event_id),
      ]);

      // Activity heatmap data
      const { data: analyticsEvents } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('event_id', event_id);

      const heatmapData: Record<string, Record<number, number>> = {};
      analyticsEvents?.forEach(event => {
        const date = new Date(event.created_at);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const hour = date.getHours();
        if (!heatmapData[day]) heatmapData[day] = {};
        heatmapData[day][hour] = (heatmapData[day][hour] || 0) + 1;
      });

      return new Response(JSON.stringify({
        metrics: {
          totalAttendees: totalAttendees || 0,
          totalMatches: totalMatches || 0,
          totalConnections: totalConnections || 0,
          totalMeetings: totalMeetings || 0,
          matchRate: totalAttendees ? Math.round(((totalMatches || 0) / totalAttendees) * 100) : 0,
          engagementRate: totalAttendees ? Math.round(((totalConnections || 0) / totalAttendees) * 100) : 0,
        },
        heatmapData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid analytics type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analytics function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
