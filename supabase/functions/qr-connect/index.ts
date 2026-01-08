import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QRConnectRequest {
  action: 'generate' | 'scan';
  qr_code_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate JWT using getClaims
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ status: 'error', message: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Parse request body
    const { action, qr_code_id }: QRConnectRequest = await req.json();
    console.log(`QR Connect action: ${action}, qr_code_id: ${qr_code_id}, user: ${userId}`);

    // ============ GENERATE ACTION ============
    // Returns the user's QR code ID for generating their QR code
    if (action === 'generate') {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('qr_code_id, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to fetch profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If no qr_code_id exists, generate one (32 char hex string)
      let qrCodeId = profile?.qr_code_id;
      if (!qrCodeId) {
        qrCodeId = crypto.randomUUID().replace(/-/g, '');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ qr_code_id: qrCodeId })
          .eq('id', userId);

        if (updateError) {
          console.error('QR code update error:', updateError);
          return new Response(
            JSON.stringify({ status: 'error', message: 'Failed to generate QR code' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          status: 'success',
          qr_code_id: qrCodeId,
          name: profile?.full_name || 'User',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============ SCAN ACTION ============
    // Processes a scanned QR code and creates a connection
    if (action === 'scan') {
      if (!qr_code_id) {
        return new Response(
          JSON.stringify({ status: 'not_found', message: 'Invalid or expired QR code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find the profile with this QR code ID
      const { data: targetProfile, error: targetError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('qr_code_id', qr_code_id)
        .maybeSingle();

      if (targetError || !targetProfile) {
        console.error('Target profile error:', targetError);
        return new Response(
          JSON.stringify({ status: 'not_found', message: 'Invalid or expired QR code' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent self-connection
      if (targetProfile.id === userId) {
        return new Response(
          JSON.stringify({
            status: 'self_connect',
            message: "You can't connect with yourself",
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if connection already exists (in either direction)
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .or(
          `and(user_id.eq.${userId},connected_user_id.eq.${targetProfile.id}),and(user_id.eq.${targetProfile.id},connected_user_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingConnection) {
        return new Response(
          JSON.stringify({
            status: 'already_connected',
            message: "You're already connected",
            connectedUserName: targetProfile.full_name,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create the connection (single direction - useConnections handles both sides)
      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          user_id: userId,
          connected_user_id: targetProfile.id,
          connected_via: 'qr_code',
        });

      if (connectionError) {
        console.error('Connection insert error:', connectionError);
        return new Response(
          JSON.stringify({ status: 'error', message: 'Failed to create connection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get current user's name for the notification
      const { data: scannerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      // Create notification for the QR code owner
      await supabase
        .from('notifications')
        .insert({
          user_id: targetProfile.id,
          type: 'new_connection',
          title: 'New Connection!',
          message: `${scannerProfile?.full_name || 'Someone'} connected with you via QR code`,
          data: { connected_user_id: userId },
        });

      // Log analytics event
      await supabase
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: 'qr_connection',
          event_data: { connected_to: targetProfile.id },
        });

      console.log(`Connection created: ${userId} -> ${targetProfile.id}`);

      return new Response(
        JSON.stringify({
          status: 'success',
          message: "You're now connected!",
          connectedUserName: targetProfile.full_name,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Invalid action
    return new Response(
      JSON.stringify({ status: 'error', message: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('QR Connect error:', error);
    return new Response(
      JSON.stringify({ status: 'error', message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
