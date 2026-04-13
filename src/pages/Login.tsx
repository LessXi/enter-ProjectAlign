import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Warehouse, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
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
          <h2 className="text-base font-semibold text-foreground mb-6 text-center">账号登录</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">姓名或邮箱 *</label>
              <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                placeholder="输入姓名或邮箱登录"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">密码 *</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码（至少6位）"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPwd ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-destructive-bg border border-destructive/20 rounded-xl px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading || !identifier || !password}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1A1A2E] text-white rounded-xl text-sm font-semibold hover:bg-[#2A2A3E] transition-all duration-200 disabled:opacity-40 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              登录
            </button>

            <p className="text-xs text-muted-foreground text-center">账号由管理员统一创建，如需开通请联系管理员</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          服装批发进销存系统 · 内部管理平台
        </p>
      </div>
    </div>
  );
}
