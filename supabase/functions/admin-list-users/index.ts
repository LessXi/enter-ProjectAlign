
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "未登录" });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user: caller }, error: authErr } = await adminClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !caller) return json({ error: "未授权" });

    const { data: callerProfile } = await adminClient.from("profiles").select("role").eq("id", caller.id).single();
    if (!callerProfile || callerProfile.role !== "boss") return json({ error: "仅老板可查看员工列表" });

    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({ perPage: 100 });
    if (listError) return json({ error: listError.message });

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

    return json({ users: result });
  } catch (err) {
    console.error(err);
    return json({ error: "服务器内部错误" });
  }
});
