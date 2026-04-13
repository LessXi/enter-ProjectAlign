import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, User, ShoppingCart, Crown, X } from 'lucide-react';
import type { Role } from '@/types/inventory';

interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

const roleMeta: Record<Role, { label: string; icon: typeof User; className: string }> = {
  warehouse: { label: '仓管', icon: User, className: 'bg-info-bg text-info' },
  purchasing: { label: '采购', icon: ShoppingCart, className: 'bg-warning-bg text-warning' },
  boss: { label: '老板', icon: Crown, className: 'bg-success-bg text-success' },
};

export default function StaffManagement() {
  const { role, session } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<Role>('warehouse');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setUsers(data?.users ?? []);
    } catch {
      console.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    if (!formEmail || !formPassword || !formName || !session) return;
    setSubmitting(true);
    setFormError('');
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email: formEmail, password: formPassword, displayName: formName, role: formRole },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuccessMsg(`账号 ${formEmail} 创建成功`);
      setShowDialog(false);
      setFormEmail('');
      setFormPassword('');
      setFormName('');
      setFormRole('warehouse');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (role !== 'boss') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">无权限访问此页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">员工管理</h2>
        <button
          onClick={() => { setShowDialog(true); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建账号
        </button>
      </div>

      {successMsg && (
        <div className="bg-success-bg border border-success/20 rounded-lg px-4 py-3 text-sm text-success font-medium">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b-2">
                  <th className="text-left py-3 px-4 font-semibold">姓名</th>
                  <th className="text-left py-3 px-4 font-semibold">邮箱</th>
                  <th className="text-center py-3 px-4 font-semibold">角色</th>
                  <th className="text-left py-3 px-4 font-semibold">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const meta = roleMeta[u.role] || roleMeta.warehouse;
                  const Icon = meta.icon;
                  return (
                    <tr key={u.id} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{u.displayName || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-muted-foreground">暂无员工数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDialog(false)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">创建员工账号</h3>
              <button onClick={() => setShowDialog(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">姓名 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入姓名"
                  className="w-full bg-background border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">邮箱 *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="输入邮箱地址"
                  className="w-full bg-background border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">密码 *</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="设置密码（至少6位）"
                  className="w-full bg-background border rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">角色 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(roleMeta) as [Role, typeof roleMeta.warehouse][]).map(([value, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={value}
                        onClick={() => setFormRole(value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-all ${
                          formRole === value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${formRole === value ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-semibold ${formRole === value ? 'text-primary' : 'text-foreground'}`}>
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3.5 py-2.5 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={submitting || !formEmail || !formPassword || !formName}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                创建账号
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
