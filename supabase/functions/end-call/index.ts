import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

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

    // Fetch Call
    const { data: call, error: callError } = await supabaseClient
      .from('calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) throw new Error("Call not found");
    if (call.caller_id !== user.id && call.receiver_id !== user.id) {
      throw new Error("Only participants can end the call");
    }
    
    if (call.status === 'ended' || call.status === 'cancelled' || call.status === 'rejected') {
      return new Response(JSON.stringify({ ok: true, status: call.status, message: "Call already finished" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const isCaller = call.caller_id === user.id;
    const finalStatus = call.status === 'ringing' ? (isCaller ? 'cancelled' : 'rejected') : 'ended';
    const now = new Date();
    
    let duration = 0;
    if (call.accepted_at && finalStatus === 'ended') {
      const acceptedAt = new Date(call.accepted_at);
      duration = Math.floor((now.getTime() - acceptedAt.getTime()) / 1000);
    }

    const { error: updateError } = await supabaseClient
      .from('calls')
      .update({ 
        status: finalStatus, 
        ended_at: now.toISOString(), 
        ended_by: user.id,
        duration_seconds: duration
      })
      .eq('id', call_id);

    if (updateError) throw new Error("Failed to end call");

    return new Response(JSON.stringify({ ok: true, status: finalStatus, duration_seconds: duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
