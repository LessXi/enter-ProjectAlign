
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

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
    if (!authHeader) return json({ error: "未登录" });

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const caller = await verifyBoss(adminClient, authHeader);
    if (!caller) return json({ error: "仅老板可以创建账号" });

    const { email, password, displayName, role } = await req.json();
    if (!email || !password || !displayName || !role) return json({ error: "请填写所有必填字段" });
    if (!["warehouse", "purchasing", "boss"].includes(role)) return json({ error: "无效角色" });
    if (password.length < 6) return json({ error: "密码至少6位" });

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name: displayName, role },
    });

    if (createError) {
      console.error("Create user error:", createError.message);
      return json({ error: createError.message });
    }

    // Store plain password in profile
    await adminClient.from("profiles").update({ password_plain: password }).eq("id", newUser.user.id);

    return json({ success: true, userId: newUser.user.id });
  } catch (err) {
    console.error("Unexpected error:", err);
    return json({ error: "服务器内部错误" });
  }
});
