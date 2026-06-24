import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { RtcTokenBuilder, RtcRole } from 'npm:agora-token';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { call_id } = await req.json();

    if (!call_id) throw new Error("Missing call_id");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const jwtStr = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwtStr);

    if (authError || !user) throw new Error("Unauthorized");

    // Fetch Call to verify Receiver and Status
    const { data: call, error: callError } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) throw new Error("Call not found");
    if (call.receiver_id !== user.id) throw new Error("Only the receiver can answer the call");
    if (call.status !== 'ringing') throw new Error("Call is not ringing");

    // Update Call Status
    const { error: updateError } = await supabaseClient
      .from('calls')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', call_id);

    if (updateError) throw new Error("Failed to update call status");

    // Generate Token
    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
      throw new Error('Agora secrets are not configured');
    }

    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      call.agora_channel_name,
      0, // Let client define UID or use 0
      RtcRole.PUBLISHER,
      privilegeExpiredTs,
      privilegeExpiredTs
    );

    return new Response(JSON.stringify({
      ok: true,
      call_id,
      status: "accepted",
      app_id: appId,
      token,
      agora_channel_name: call.agora_channel_name,
      uid: 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
