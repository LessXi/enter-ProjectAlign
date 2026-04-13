
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: callerProfile } = await adminClient.from("profiles").select("role").eq("id", caller.id).single();
    if (!callerProfile || callerProfile.role !== "boss") return new Response(JSON.stringify({ error: "Only boss can list users" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 100 });
    if (listError) return new Response(JSON.stringify({ error: listError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profiles } = await adminClient.from("profiles").select("id, display_name, role, password_plain, created_at");
    const profileMap = new Map((profiles || []).map((p: { id: string; display_name: string; role: string; password_plain: string; created_at: string }) => [p.id, p]));

    const result = users.map((u) => {
      const profile = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email,
        displayName: profile?.display_name || '',
        role: profile?.role || 'warehouse',
        passwordPlain: profile?.password_plain || '',
        createdAt: u.created_at,
      };
    });

    return new Response(JSON.stringify({ users: result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
