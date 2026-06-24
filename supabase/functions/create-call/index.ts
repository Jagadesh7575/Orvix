import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SignJWT, importPKCS8 } from "https://deno.land/x/jose@v5.2.2/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { receiver_id, chat_id, call_type } = await req.json();

    if (!receiver_id || !call_type || !['voice', 'video'].includes(call_type)) {
      throw new Error("Missing or invalid required fields (receiver_id, call_type)");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const jwtStr = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwtStr);

    if (authError || !user) throw new Error("Unauthorized");
    const caller_id = user.id;

    if (caller_id === receiver_id) throw new Error("Cannot call yourself");

    // Check receiver exists
    const { data: receiver, error: receiverError } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('id', receiver_id)
      .single();

    if (receiverError || !receiver) throw new Error("Receiver not found");

    // Validate chat members
    if (chat_id) {
      const { data: members, error: membersError } = await supabaseAdmin
        .from("chat_members")
        .select("user_id")
        .eq("chat_id", chat_id)
        .in("user_id", [caller_id, receiver_id]);

      if (membersError || !members || members.length !== 2) {
        throw new Error("Sender or receiver not in the specified chat");
      }
    }

    const agora_channel_name = `orvix_call_${crypto.randomUUID()}`;

    // Insert Call
    const { data: call, error: callError } = await supabaseAdmin
      .from('calls')
      .insert({
        chat_id,
        caller_id,
        receiver_id,
        call_type,
        status: 'ringing',
        agora_channel_name
      })
      .select()
      .single();

    if (callError || !call) throw new Error("Failed to create call: " + callError?.message);

    // Insert Participants
    await supabaseAdmin.from('call_participants').insert([
      { call_id: call.id, user_id: caller_id, role: 'caller' },
      { call_id: call.id, user_id: receiver_id, role: 'receiver' }
    ]);

    // Send Push Notification
    const { data: tokens } = await supabaseAdmin
      .from("device_tokens")
      .select("token")
      .eq("user_id", receiver_id)
      .eq("platform", "android")
      .eq("device_id", "default")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (tokens && tokens.length > 0) {
      const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
      if (serviceAccountJson) {
        try {
          const serviceAccount = JSON.parse(serviceAccountJson);
          const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
          const clientEmail = serviceAccount.client_email;
          const projectId = serviceAccount.project_id;

          const key = await importPKCS8(privateKey, "RS256");
          const jwt = await new SignJWT({
            iss: clientEmail,
            sub: clientEmail,
            aud: "https://oauth2.googleapis.com/token",
            scope: "https://www.googleapis.com/auth/firebase.messaging",
          })
            .setProtectedHeader({ alg: "RS256", typ: "JWT" })
            .setIssuedAt()
            .setExpirationTime("1h")
            .sign(key);

          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
          });

          const tokenData = await tokenRes.json();
          if (tokenRes.ok) {
            // Get Caller Name
            const { data: callerProfile } = await supabaseAdmin.from('profiles').select('username').eq('id', caller_id).single();
            const callerName = callerProfile?.username || "Someone";
            const callTitle = call_type === 'voice' ? "Incoming voice call" : "Incoming video call";

            const fcmPayload = {
              message: {
                token: tokens[0].token,
                notification: {
                  title: callTitle,
                  body: `${callerName} is calling you`,
                },
                data: {
                  type: "incoming_call",
                  call_id: call.id,
                  caller_id: caller_id,
                  receiver_id: receiver_id,
                  call_type: call_type,
                  agora_channel_name: agora_channel_name
                },
                android: {
                  priority: "HIGH",
                  notification: {
                    channel_id: "orvix_calls",
                    priority: "HIGH",
                    default_sound: true,
                    default_vibrate_timings: true
                  }
                }
              },
            };

            await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(fcmPayload),
            });
          }
        } catch (e) {
          console.error("FCM Error", e);
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      call_id: call.id,
      caller_id: call.caller_id,
      receiver_id: call.receiver_id,
      call_type: call.call_type,
      status: "ringing",
      agora_channel_name: call.agora_channel_name
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
