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

    const { event_id } = await req.json();

    // Get user's profile
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get potential matches (other attendees)
    let query = supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .eq('is_visible', true)
      .limit(20);

    const { data: candidates } = await query;

    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use AI to analyze and score matches
    const prompt = `You are an AI matchmaking engine for a professional conference networking app.

Analyze the user and candidates to generate match scores and explanations.

USER PROFILE:
Name: ${userProfile.full_name}
Title: ${userProfile.title}
Company: ${userProfile.company}
Skills: ${(userProfile.skills || []).join(', ')}
Interests: ${(userProfile.interests || []).join(', ')}
Goals: ${(userProfile.goals || []).join(', ')}
Bio: ${userProfile.bio}

CANDIDATE PROFILES:
${candidates.map((c, i) => `
[${i}] ${c.full_name}
Title: ${c.title}
Company: ${c.company}
Skills: ${(c.skills || []).join(', ')}
Interests: ${(c.interests || []).join(', ')}
Goals: ${(c.goals || []).join(', ')}
Bio: ${c.bio}
`).join('\n')}

For each candidate, provide a match analysis. Return JSON array with objects containing:
- index: candidate index number
- score: match score 0-100
- confidence: confidence level 0.0-1.0
- explanation: 1-2 sentence explanation of why they match
- shared_skills: array of overlapping skills
- shared_interests: array of overlapping interests

Focus on complementary skills, shared interests, and potential collaboration opportunities.
Return ONLY valid JSON array, no other text.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional networking matchmaking AI. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
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
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '[]';
    
    // Parse AI response
    let matchAnalysis;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      matchAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      matchAnalysis = [];
    }

    // Build matches with candidate data
    const matches = matchAnalysis.map((analysis: any) => {
      const candidate = candidates[analysis.index];
      if (!candidate) return null;
      
      return {
        user_id: user.id,
        matched_user_id: candidate.id,
        event_id: event_id || null,
        match_score: analysis.score,
        confidence_score: analysis.confidence,
        ai_explanation: analysis.explanation,
        shared_skills: analysis.shared_skills || [],
        shared_interests: analysis.shared_interests || [],
        profile: {
          id: candidate.id,
          full_name: candidate.full_name,
          title: candidate.title,
          company: candidate.company,
          location: candidate.location,
          avatar_url: candidate.avatar_url,
          skills: candidate.skills,
          interests: candidate.interests,
          bio: candidate.bio,
        }
      };
    }).filter(Boolean);

    // Sort by score
    matches.sort((a: any, b: any) => b.match_score - a.match_score);

    // Store matches in database
    for (const match of matches.slice(0, 10)) {
      const { profile, ...matchData } = match;
      await supabase
        .from('matches')
        .upsert({
          ...matchData,
          status: 'pending',
        }, { onConflict: 'user_id,matched_user_id,event_id' });
    }

    console.log(`Generated ${matches.length} matches for user ${user.id}`);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-match function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
