
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyBoss(adminClient: ReturnType<typeof createClient>, authHeader: string) {
  const { data: { user }, error } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return null;
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "boss") return null;
  return user;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const caller = await verifyBoss(adminClient, authHeader);
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action, userId, email, password, displayName, role } = await req.json();
    if (!userId || !action) return new Response(JSON.stringify({ error: "Missing userId or action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (action === "delete") {
      if (userId === caller.id) return new Response(JSON.stringify({ error: "不能删除自己的账号" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await adminClient.from("profiles").delete().eq("id", userId);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
      if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update") {
      const authUpdate: Record<string, unknown> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (Object.keys(authUpdate).length > 0) {
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, authUpdate);
        if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const profileUpdate: Record<string, string> = {};
      if (displayName !== undefined) profileUpdate.display_name = displayName;
      if (role) profileUpdate.role = role;
      if (password) profileUpdate.password_plain = password;
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profErr } = await adminClient.from("profiles").update(profileUpdate).eq("id", userId);
        if (profErr) return new Response(JSON.stringify({ error: profErr.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
