
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
    if (!caller) return json({ error: "仅老板可以管理员工" });

    const { action, userId, email, password, displayName, role } = await req.json();
    if (!userId || !action) return json({ error: "缺少必要参数" });

    if (action === "delete") {
      if (userId === caller.id) return json({ error: "不能删除自己的账号" });
      await adminClient.from("profiles").delete().eq("id", userId);
      const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
      if (delErr) return json({ error: delErr.message });
      return json({ success: true });
    }

    if (action === "update") {
      const authUpdate: Record<string, unknown> = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (Object.keys(authUpdate).length > 0) {
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, authUpdate);
        if (updateErr) return json({ error: updateErr.message });
      }

      const profileUpdate: Record<string, string> = {};
      if (displayName !== undefined) profileUpdate.display_name = displayName;
      if (role) profileUpdate.role = role;
      if (password) profileUpdate.password_plain = password;
      if (Object.keys(profileUpdate).length > 0) {
        const { error: profErr } = await adminClient.from("profiles").update(profileUpdate).eq("id", userId);
        if (profErr) return json({ error: profErr.message });
      }

      return json({ success: true });
    }

    return json({ error: "无效操作" });
  } catch (err) {
    console.error(err);
    return json({ error: "服务器内部错误" });
  }
});
