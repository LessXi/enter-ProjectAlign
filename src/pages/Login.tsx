import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { Role } from '@/types/inventory';
import { Warehouse, Loader2, User, ShoppingCart, Eye, EyeOff } from 'lucide-react';

type Tab = 'login' | 'register';

const roleOptions: { value: Role; label: string; desc: string; icon: typeof User }[] = [
  { value: 'warehouse', label: '仓管', desc: '录入出入库，查看库存', icon: User },
  { value: 'purchasing', label: '采购', desc: '创建采购单，管理供应商', icon: ShoppingCart },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [tab, setTab] = useState<Tab>('login');
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('warehouse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) return;
    setLoading(true);
    setError('');
    try {
      await signIn(identifier, password);
      navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '登录失败，请检查账号和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !displayName) return;
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, displayName, role);
      navigate('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-mint/50 focus:border-mint transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-[#1A1A2E] flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-mint" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">进销存系统</h1>
            <p className="text-xs text-muted-foreground">服装批发管理平台</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl shadow-elevated p-8 border border-border/50">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === t ? 'bg-[#1A1A2E] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'login' ? '账号登录' : '注册账号'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">姓名 *</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="输入您的姓名" className={inputCls} />
              </div>
            )}

            {tab === 'login' ? (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">姓名或邮箱 *</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="输入姓名或邮箱登录"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className={inputCls} />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">邮箱 *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入邮箱地址" className={inputCls} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">密码 *</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码（至少6位）"
                  onKeyDown={(e) => e.key === 'Enter' && tab === 'login' && handleLogin()}
                  className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">选择角色 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map(({ value, label, desc, icon: Icon }) => (
                    <button key={value} onClick={() => setRole(value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                        role === value ? 'border-[#1A1A2E] bg-[#1A1A2E]/5' : 'border-border hover:border-foreground/30'
                      }`}>
                      <Icon className={`w-5 h-5 ${role === value ? 'text-foreground' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${role === value ? 'text-foreground' : 'text-card-foreground'}`}>{label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">老板账号由管理员创建，如需开通请联系管理员</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive-bg border border-destructive/20 rounded-xl px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              onClick={tab === 'login' ? handleLogin : handleRegister}
              disabled={loading || (tab === 'login' ? !identifier || !password : !email || !password || !displayName)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all duration-200 disabled:opacity-40 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {tab === 'login' ? '登录' : '注册并登录'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          服装批发进销存系统 · 内部管理平台
        </p>
      </div>
    </div>
  );
}
