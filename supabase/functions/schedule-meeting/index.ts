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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
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

    const { 
      action = 'create', 
      attendee_id, 
      title, 
      meeting_type = 'video',
      scheduled_at,
      duration_minutes = 30,
      location,
      event_id,
      meeting_id
    } = await req.json();

    if (action === 'create') {
      if (!attendee_id || !title || !scheduled_at) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create the meeting
      const { data: meeting, error } = await supabase
        .from('meetings')
        .insert({
          organizer_id: user.id,
          attendee_id,
          title,
          meeting_type,
          scheduled_at,
          duration_minutes,
          location,
          event_id,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for attendee
      await supabase.from('notifications').insert({
        user_id: attendee_id,
        type: 'meeting',
        title: 'New Meeting Scheduled',
        message: `You have a new meeting: ${title}`,
        data: { meeting_id: meeting.id },
      });

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_id,
        event_type: 'meeting_scheduled',
        event_data: { meeting_id: meeting.id, attendee_id },
      });

      console.log(`Meeting created: ${meeting.id}`);

      return new Response(JSON.stringify({ meeting }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'suggest') {
      // AI-powered meeting time suggestions
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY is not configured');
      }

      // Get both users' existing meetings
      const { data: existingMeetings } = await supabase
        .from('meetings')
        .select('scheduled_at, duration_minutes')
        .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id},organizer_id.eq.${attendee_id},attendee_id.eq.${attendee_id}`)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      const prompt = `Given the existing meetings, suggest 3 optimal time slots for a new ${duration_minutes}-minute meeting.

EXISTING MEETINGS:
${existingMeetings?.map(m => `- ${new Date(m.scheduled_at).toLocaleString()} (${m.duration_minutes} min)`).join('\n') || 'No existing meetings'}

CONSTRAINTS:
- Business hours only (9 AM - 6 PM)
- At least 15 minute buffer between meetings
- Prefer mornings for important meetings
- Consider time zones

Return JSON array with 3 suggestions:
[
  { "datetime": "ISO datetime string", "reason": "brief reason" }
]

Only return valid JSON, no other text.`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a scheduling assistant. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('AI suggestion failed');
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '[]';
      
      let suggestions;
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch {
        suggestions = [];
      }

      return new Response(JSON.stringify({ suggestions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update' && meeting_id) {
      const { data: meeting, error } = await supabase
        .from('meetings')
        .update({
          title,
          meeting_type,
          scheduled_at,
          duration_minutes,
          location,
          status: 'rescheduled',
        })
        .eq('id', meeting_id)
        .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ meeting }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'cancel' && meeting_id) {
      const { data: meeting, error } = await supabase
        .from('meetings')
        .update({ status: 'cancelled' })
        .eq('id', meeting_id)
        .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ meeting }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in schedule-meeting function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
