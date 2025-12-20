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

    const { action, qr_code_id } = await req.json();

    if (action === 'generate') {
      // Get or create QR code for user
      const { data: profile } = await supabase
        .from('profiles')
        .select('qr_code_id, full_name')
        .eq('id', user.id)
        .single();

      if (!profile?.qr_code_id) {
        // Generate new QR code ID
        const newQrId = crypto.randomUUID().split('-')[0];
        await supabase
          .from('profiles')
          .update({ qr_code_id: newQrId })
          .eq('id', user.id);
        
        return new Response(JSON.stringify({ qr_code_id: newQrId }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ qr_code_id: profile.qr_code_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'scan' && qr_code_id) {
      // Find the profile with this QR code
      const { data: scannedProfile } = await supabase
        .from('profiles')
        .select('id, full_name, title, company, avatar_url, skills, interests')
        .eq('qr_code_id', qr_code_id)
        .single();

      if (!scannedProfile) {
        return new Response(JSON.stringify({ error: 'Profile not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (scannedProfile.id === user.id) {
        return new Response(JSON.stringify({ error: 'Cannot connect with yourself' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if already connected
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('connected_user_id', scannedProfile.id)
        .single();

      if (existingConnection) {
        return new Response(JSON.stringify({ 
          message: 'Already connected',
          profile: scannedProfile 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create bidirectional connections
      await supabase.from('connections').insert([
        { user_id: user.id, connected_user_id: scannedProfile.id, connected_via: 'qr_code' },
        { user_id: scannedProfile.id, connected_user_id: user.id, connected_via: 'qr_code' }
      ]);

      // Create notifications
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      await supabase.from('notifications').insert({
        user_id: scannedProfile.id,
        type: 'connection',
        title: 'New Connection via QR',
        message: `${userProfile?.full_name || 'Someone'} connected with you via QR code!`,
        data: { user_id: user.id },
      });

      // Log analytics
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'qr_connection',
        event_data: { connected_user_id: scannedProfile.id },
      });

      console.log(`QR connection: ${user.id} -> ${scannedProfile.id}`);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Connected successfully!',
        profile: scannedProfile 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in qr-connect function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
