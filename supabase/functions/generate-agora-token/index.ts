import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { call_id, channel_name, uid, role } = await req.json();
    if (!call_id || !channel_name || uid === undefined) {
      throw new Error('Missing required fields');
    }

    // Verify user is part of the call
    const { data: call, error: callError } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      throw new Error('Call not found or access denied');
    }

    if (call.caller_id !== user.id && call.receiver_id !== user.id) {
      throw new Error('You are not a participant of this call');
    }

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
      throw new Error('Agora secrets are not configured');
    }

    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channel_name,
      uid,
      rtcRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return new Response(
      JSON.stringify({ ok: true, app_id: appId, token, channel_name, uid, expires_at: privilegeExpiredTs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
