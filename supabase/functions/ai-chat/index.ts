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

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

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

    const { message, conversation_history = [] } = await req.json();

    // Get user's profile and context
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get user's recent matches
    const { data: matches } = await supabase
      .from('matches')
      .select(`
        *,
        matched_profile:profiles!matches_matched_user_id_fkey(full_name, title, company)
      `)
      .eq('user_id', user.id)
      .order('match_score', { ascending: false })
      .limit(5);

    // Get upcoming meetings
    const { data: meetings } = await supabase
      .from('meetings')
      .select(`
        *,
        attendee:profiles!meetings_attendee_id_fkey(full_name)
      `)
      .or(`organizer_id.eq.${user.id},attendee_id.eq.${user.id}`)
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    const systemPrompt = `You are MeetMate AI, a friendly and helpful networking assistant for professional conferences.

USER CONTEXT:
Name: ${userProfile?.full_name || 'Attendee'}
Title: ${userProfile?.title || 'Professional'}
Company: ${userProfile?.company || 'Company'}
Skills: ${(userProfile?.skills || []).join(', ') || 'Various'}
Interests: ${(userProfile?.interests || []).join(', ') || 'Networking'}

TOP MATCHES:
${matches?.map(m => `- ${m.matched_profile?.full_name} (${m.matched_profile?.title} at ${m.matched_profile?.company}) - ${m.match_score}% match`).join('\n') || 'No matches yet'}

UPCOMING MEETINGS:
${meetings?.map(m => `- ${m.title} with ${m.attendee?.full_name} at ${new Date(m.scheduled_at).toLocaleString()}`).join('\n') || 'No upcoming meetings'}

CAPABILITIES:
1. Help find and explain matches
2. Suggest conversation starters and talking points
3. Draft follow-up messages
4. Recommend meeting times
5. Provide networking tips
6. Answer questions about connections

Be conversational, helpful, and proactive. Suggest specific actions when appropriate.
Keep responses concise but informative (2-3 sentences max unless asked for details).`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI chat failed');
    }

    // Stream the response
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
