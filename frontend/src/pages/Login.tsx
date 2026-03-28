import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GREEN = '#6DFF8A';

const DEMO = [
  {
    section: 'Buyers',
    accounts: [
      { label: 'Eko Hotels & Suites',          email: 'buyer@demo.com'  },
      { label: 'Chicken Republic VI',           email: 'buyer2@demo.com' },
      { label: 'Lagos Food Bank',               email: 'buyer3@demo.com' },
      { label: 'Chrisland Schools',             email: 'buyer4@demo.com' },
    ],
  },
  {
    section: 'Farmers',
    accounts: [
      { label: 'Emeka Okafor — Ifo, Ogun',     email: 'farmer@demo.com'  },
      { label: 'Amaka Nwosu — Ibadan, Oyo',    email: 'farmer2@demo.com' },
      { label: 'Tunde Adeyemi — Sagamu, Ogun', email: 'farmer3@demo.com' },
    ],
  },
  {
    section: 'Admin',
    accounts: [
      { label: 'FarmLink Admin',                email: 'admin@demo.com' },
    ],
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const getDashboard = (role: string) =>
    role === 'buyer' ? '/buyer' : role === 'farmer' ? '/farmer' : '/admin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success('Signed in successfully');
      navigate(getDashboard(u.role), { replace: true });
    } catch (err: any) {
      if (!err.response) toast.error('Cannot connect to server. Is the backend running?');
      else toast.error(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Logo top-left */}
      <div className="px-8 py-6">
        <Link to="/">
          <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-base font-bold text-gray-900 tracking-tight">
            FarmLink
          </span>
        </Link>
      </div>

      {/* Centered form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[360px]">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">Sign in</h1>
          <p className="text-sm text-gray-400 mb-8 text-center">Welcome back to your account</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required placeholder="you@example.com"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required placeholder="••••••••"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl text-gray-950 transition-opacity hover:opacity-90 mt-1"
              style={{ background: GREEN }}>
              {loading ? 'Signing in…' : <><span>Continue</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            No account?{' '}
            <Link to="/register" className="font-semibold text-gray-900 hover:text-gray-700">Create one</Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button type="button" onClick={() => setDemoOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-xs font-semibold text-gray-700">Try a demo account</p>
                <p className="text-[10px] text-gray-400 mt-0.5">password: <span className="font-mono">password123</span></p>
              </div>
              <ChevronDown size={15} className={`text-gray-400 transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
            </button>
            {demoOpen && (
              <div className="border-t border-gray-100">
                {DEMO.map(group => (
                  <div key={group.section}>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-1">{group.section}</p>
                    {group.accounts.map(d => (
                      <button key={d.email} type="button"
                        onClick={async () => {
                          setDemoOpen(false);
                          setLoading(true);
                          try {
                            const u = await login(d.email, 'password123');
                            toast.success('Signed in successfully');
                            navigate(getDashboard(u.role), { replace: true });
                          } catch {
                            toast.error('Demo account unavailable. Run db:seed in the backend.');
                          } finally { setLoading(false); }
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{d.label}</p>
                          <p className="text-[11px] text-gray-400">{d.email}</p>
                        </div>
                        <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-[11px] text-gray-400">
          <Link to="/terms" className="hover:text-gray-700 transition-colors">Terms of service</Link>
          {' · '}
          <Link to="/privacy" className="hover:text-gray-700 transition-colors">Privacy policy</Link>
          {' · '}
          © {new Date().getFullYear()} FarmLink
        </p>
      </div>
    </div>
  );
}
