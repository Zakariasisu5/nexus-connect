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
        { count: completedMeetings },
        { count: totalMessages }
      ] = await Promise.all([
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('meetings').select('*', { count: 'exact', head: true }).or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`),
        supabase.from('meetings').select('*', { count: 'exact', head: true })
          .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
          .eq('status', 'completed'),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('sender_id', user.id),
      ]);

      // Get match score distribution
      const { data: matchScores } = await supabase
        .from('matches')
        .select('match_score')
        .eq('user_id', user.id);

      const avgMatchScore = matchScores?.length 
        ? Math.round(matchScores.reduce((sum, m) => sum + (m.match_score || 0), 0) / matchScores.length)
        : 0;

      // Calculate response rate based on messages received vs conversations
      const { count: receivedMessages } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', user.id);

      const responseRate = receivedMessages && totalMessages 
        ? Math.min(100, Math.round((totalMessages / receivedMessages) * 100))
        : 0;

      // Get weekly activity data for charts - last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get matches by day
      const { data: recentMatches } = await supabase
        .from('matches')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get meetings by day
      const { data: recentMeetings } = await supabase
        .from('meetings')
        .select('created_at')
        .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get messages by day
      const { data: recentMessages } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('sender_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get connections by day
      const { data: recentConnections } = await supabase
        .from('connections')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get analytics events for engagement heatmap
      const { data: analyticsEvents } = await supabase
        .from('analytics_events')
        .select('event_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Group activity by day of week
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyData: Record<string, { matches: number; meetings: number; messages: number; connections: number }> = {};
      
      dayNames.forEach(day => {
        weeklyData[day] = { matches: 0, meetings: 0, messages: 0, connections: 0 };
      });

      recentMatches?.forEach(m => {
        const day = dayNames[new Date(m.created_at).getDay()];
        weeklyData[day].matches++;
      });

      recentMeetings?.forEach(m => {
        const day = dayNames[new Date(m.created_at).getDay()];
        weeklyData[day].meetings++;
      });

      recentMessages?.forEach(m => {
        const day = dayNames[new Date(m.created_at).getDay()];
        weeklyData[day].messages++;
      });

      recentConnections?.forEach(c => {
        const day = dayNames[new Date(c.created_at).getDay()];
        weeklyData[day].connections++;
      });

      // Build engagement heatmap by hour
      const engagementByHour: Record<number, number> = {};
      for (let h = 9; h <= 17; h++) {
        engagementByHour[h] = 0;
      }

      analyticsEvents?.forEach(event => {
        const hour = new Date(event.created_at).getHours();
        if (hour >= 9 && hour <= 17) {
          engagementByHour[hour]++;
        }
      });

      // Also count messages, matches, meetings, connections by hour
      [...(recentMatches || []), ...(recentMeetings || []), ...(recentMessages || []), ...(recentConnections || [])].forEach(item => {
        const hour = new Date(item.created_at).getHours();
        if (hour >= 9 && hour <= 17) {
          engagementByHour[hour]++;
        }
      });

      // Convert to chart format
      const chartData = dayNames.slice(1).concat(dayNames[0]).map(day => ({
        day,
        matches: weeklyData[day].matches,
        meetings: weeklyData[day].meetings,
        messages: weeklyData[day].messages,
        connections: weeklyData[day].connections,
      }));

      // Convert engagement to level format
      const maxEngagement = Math.max(...Object.values(engagementByHour), 1);
      const engagementData = Object.entries(engagementByHour).map(([hour, count]) => {
        const ratio = count / maxEngagement;
        let level = 'low';
        if (ratio > 0.75) level = 'very-high';
        else if (ratio > 0.5) level = 'high';
        else if (ratio > 0.25) level = 'medium';
        
        return {
          time: `${hour}:00 ${parseInt(hour) >= 12 ? 'PM' : 'AM'}`.replace(/^(\d):/, '0$1:'),
          level,
          count,
        };
      });

      return new Response(JSON.stringify({
        total_matches: totalMatches || 0,
        total_connections: totalConnections || 0,
        total_meetings: totalMeetings || 0,
        total_messages: totalMessages || 0,
        completed_meetings: completedMeetings || 0,
        avg_match_score: avgMatchScore,
        response_rate: responseRate,
        conversion_rate: totalMatches ? Math.round(((totalConnections || 0) / (totalMatches || 1)) * 100) : 0,
        chart_data: chartData,
        engagement_data: engagementData,
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
