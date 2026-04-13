import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Plus, User, ShoppingCart, Crown, X, Pencil, Trash2, Eye, EyeOff, Copy, Check } from 'lucide-react';
import type { Role } from '@/types/inventory';

interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  passwordPlain: string;
  createdAt: string;
}

const roleMeta: Record<Role, { label: string; icon: typeof User; className: string }> = {
  warehouse: { label: '仓管', icon: User, className: 'bg-info-bg text-info' },
  purchasing: { label: '采购', icon: ShoppingCart, className: 'bg-warning-bg text-warning' },
  boss: { label: '老板', icon: Crown, className: 'bg-success-bg text-success' },
};

type DialogMode = 'create' | 'edit' | null;

export default function StaffManagement() {
  const { role, session, user: currentUser, signOut } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

  // Form state
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<Role>('warehouse');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Created credentials display
  const [createdCreds, setCreatedCreds] = useState<{ name: string; email: string; password: string; role: string } | null>(null);

  // Password visibility for credentials card
  const [showCredsPwd, setShowCredsPwd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [visiblePwdIds, setVisiblePwdIds] = useState<Set<string>>(new Set());

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-users', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setUsers(data?.users ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '获取员工列表失败';
      console.error('Failed to fetch users:', msg);
      if (msg.includes('Unauthorized') || msg.includes('JWT')) {
        showToast('error', '登录已过期，请重新登录');
      }
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetForm = () => {
    setFormEmail('');
    setFormPassword('');
    setFormName('');
    setFormRole('warehouse');
    setFormError('');
    setShowPassword(false);
    setCopied(false);
  };

  const openCreate = () => {
    resetForm();
    setEditingUser(null);
    setDialogMode('create');
    setCreatedCreds(null);
    setShowCredsPwd(false);
  };

  const openEdit = (u: StaffUser) => {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormName(u.displayName);
    setFormRole(u.role);
    setFormPassword('');
    setFormError('');
    setShowPassword(false);
    setDialogMode('edit');
  };

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
      setCreatedCreds({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: roleMeta[formRole].label,
      });
      setDialogMode(null);
      showToast('success', `账号 ${formName} 创建成功`);
      fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingUser || !session) return;
    setSubmitting(true);
    setFormError('');
    try {
      const body: Record<string, string> = {
        action: 'update',
        userId: editingUser.id,
      };
      if (formEmail !== editingUser.email) body.email = formEmail;
      if (formName !== editingUser.displayName) body.displayName = formName;
      if (formRole !== editingUser.role) body.role = formRole;
      if (formPassword) body.password = formPassword;

      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDialogMode(null);
      // If user changed their own password, force re-login
      if (formPassword && editingUser.id === currentUser?.id) {
        showToast('success', '密码已修改，请重新登录');
        setTimeout(() => signOut(), 1500);
        return;
      }
      showToast('success', `已更新 ${formName} 的信息`);
      fetchUsers();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !session) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-manage-user', {
        body: { action: 'delete', userId: deleteTarget.id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDeleteTarget(null);
      showToast('success', `已删除 ${deleteTarget.displayName || deleteTarget.email}`);
      fetchUsers();
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : '删除失败');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          创建账号
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
          toast.type === 'success' ? 'bg-success-bg border border-success/20 text-success' : 'bg-destructive/10 border border-destructive/20 text-destructive'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Created Credentials Card */}
      {createdCreds && (
        <div className="bg-card rounded-lg shadow-card p-5 border-2 border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-primary">新账号已创建 - 请记录登录信息</h3>
            <button onClick={() => setCreatedCreds(null)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">姓名：</span>
              <span className="font-medium">{createdCreds.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">角色：</span>
              <span className="font-medium">{createdCreds.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground">邮箱：</span>
              <span className="font-medium font-mono">{createdCreds.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">密码：</span>
              <span className="font-medium font-mono">{showCredsPwd ? createdCreds.password : '********'}</span>
              <button
                onClick={() => setShowCredsPwd(!showCredsPwd)}
                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title={showCredsPwd ? '隐藏密码' : '显示密码'}
              >
                {showCredsPwd ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => copyToClipboard(`姓名: ${createdCreds.name}\n邮箱: ${createdCreds.email}\n密码: ${createdCreds.password}\n角色: ${createdCreds.role}`)}
                className="p-1 rounded hover:bg-secondary transition-colors"
                title="复制全部信息"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User table */}
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
                  <th className="text-left py-3 px-4 font-semibold">密码</th>
                  <th className="text-center py-3 px-4 font-semibold">角色</th>
                  <th className="text-left py-3 px-4 font-semibold">创建时间</th>
                  <th className="text-right py-3 px-4 font-semibold">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => {
                  const meta = roleMeta[u.role] || roleMeta.warehouse;
                  const Icon = meta.icon;
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className={`border-b last:border-0 ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}>
                      <td className="py-3 px-4 font-medium">{u.displayName || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">{u.email}</td>
                      <td className="py-3 px-4">
                        {u.passwordPlain ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs">{visiblePwdIds.has(u.id) ? u.passwordPlain : '********'}</span>
                            <button
                              onClick={() => setVisiblePwdIds(prev => {
                                const next = new Set(prev);
                                if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                                return next;
                              })}
                              className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {visiblePwdIds.has(u.id) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                            title="编辑"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">暂无员工数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog */}
      {dialogMode && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDialogMode(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold">
                {dialogMode === 'create' ? '创建员工账号' : `编辑 ${editingUser?.displayName || ''}`}
              </h3>
              <button onClick={() => setDialogMode(null)} className="text-muted-foreground hover:text-foreground">
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
                <label className="block text-sm font-medium mb-1.5">
                  密码 {dialogMode === 'create' ? '*' : '（留空则不修改）'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={dialogMode === 'create' ? '设置密码（至少6位）' : '输入新密码'}
                    className="w-full bg-background border rounded-lg px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">角色 *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(roleMeta) as [Role, typeof roleMeta.warehouse][]).map(([value, meta]) => {
                    const RIcon = meta.icon;
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
                        <RIcon className={`w-5 h-5 ${formRole === value ? 'text-primary' : 'text-muted-foreground'}`} />
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
                onClick={dialogMode === 'create' ? handleCreate : handleUpdate}
                disabled={submitting || !formEmail || !formName || (dialogMode === 'create' && !formPassword)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {dialogMode === 'create' ? '创建账号' : '保存修改'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">确认删除</h3>
            <p className="text-sm text-muted-foreground mb-5">
              确定要删除 <span className="font-medium text-foreground">{deleteTarget.displayName || deleteTarget.email}</span> 的账号吗？此操作不可撤销。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-secondary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
