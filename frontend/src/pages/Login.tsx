import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import Avatar from '../components/Avatar';
import { PHOTOS } from '../lib/media';

const DEMO = [
  {
    section: 'Buyers',
    accounts: [
      { label: 'Eko Hotels & Suites',          email: 'buyer@demo.com',  person: 'Emeka Adeyemi'   },
      { label: 'Chicken Republic VI',           email: 'buyer2@demo.com', person: 'Ngozi Okonkwo'   },
      { label: 'Lagos Food Bank',               email: 'buyer3@demo.com', person: 'Dr. Segun Bello' },
      { label: 'Chrisland Schools',             email: 'buyer4@demo.com', person: 'Folake Adesanya' },
    ],
  },
  {
    section: 'Farmers',
    accounts: [
      { label: 'Emeka Okafor · Ifo, Ogun',     email: 'farmer@demo.com',  person: 'Emeka Okafor'  },
      { label: 'Amaka Nwosu · Ibadan, Oyo',    email: 'farmer2@demo.com', person: 'Amaka Nwosu'   },
      { label: 'Tunde Adeyemi · Sagamu, Ogun', email: 'farmer3@demo.com', person: 'Tunde Adeyemi' },
    ],
  },
  {
    section: 'Admin',
    accounts: [
      { label: 'FarmLink Admin',                email: 'admin@demo.com', person: 'FarmLink Admin' },
    ],
  },
];

// Free-tier hosting sleeps when idle; tell people why the first sign-in can take a moment
async function withWakeNotice<T>(task: Promise<T>): Promise<T> {
  const timer = setTimeout(() => {
    toast.loading('Waking up the FarmLink server. The first sign-in can take up to a minute.', { id: 'wake' });
  }, 3500);
  try { return await task; }
  finally { clearTimeout(timer); toast.dismiss('wake'); }
}

function signInError(err: any, demo: boolean) {
  // A crashed or restarting server answers without CORS headers, which looks like no response at all
  if (!err?.response) return navigator.onLine
    ? "FarmLink's server isn't responding right now. Please try again in a minute."
    : "You're offline. Check your connection and try again.";
  if (err.response.status >= 500) return 'The server is having trouble reaching its database. Please try again shortly.';
  if (demo && err.response.status === 401) return 'This demo account is missing. The database needs its demo data loaded.';
  return err.response?.data?.error || 'Invalid email or password';
}

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
      const u = await withWakeNotice(login(email, password));
      toast.success('Signed in successfully');
      navigate(getDashboard(u.role), { replace: true });
    } catch (err: any) {
      toast.error(signInError(err, false));
    } finally { setLoading(false); }
  };

  return (
    <AuthShell
      photo={PHOTOS.marketStall}
      photoAlt="A produce seller arranging peppers and cucumbers at a Nigerian market stall"
      headline="Fresh produce, sourced directly from the farm."
      caption="Buyers and verified farmers trading on one transparent record, from demand to delivery."
      topRight={
        <p className="text-sm text-gray-500">
          New here? <Link to="/register" className="font-semibold text-forest-900 hover:underline">Create an account</Link>
        </p>
      }
      footer={
        <>
          <Link to="/terms" className="hover:text-gray-800">Terms of service</Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:text-gray-800">Privacy policy</Link>
          <span className="mx-2">·</span>
          © {new Date().getFullYear()} FarmLink
        </>
      }
    >
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">Sign in</h1>
      <p className="mt-2 text-sm text-gray-600">Sign in to manage your demands, offers and deliveries.</p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-4">
        <div>
          <label className="label">Email address</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            required placeholder="you@example.com" autoComplete="email"
            className="input h-11"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            required placeholder="••••••••" autoComplete="current-password"
            className="input h-11"
          />
        </div>

        <button type="submit" disabled={loading}
          className="btn-lg btn-primary mt-2 w-full">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Continue <ArrowRight size={16} /></>}
        </button>
      </form>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <button type="button" onClick={() => setDemoOpen(o => !o)}
          className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50">
          <div className="flex -space-x-2">
            {['Emeka Adeyemi', 'Amaka Nwosu', 'Tunde Adeyemi'].map(n => <Avatar key={n} name={n} size={28} ring />)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">Try a demo account</p>
            <p className="text-xs text-gray-500">password: <span className="font-mono">password123</span></p>
          </div>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${demoOpen ? 'rotate-180' : ''}`} />
        </button>
        {demoOpen && (
          <div className="animate-fade-in border-t border-gray-100 pb-2">
            {DEMO.map(group => (
              <div key={group.section}>
                <p className="px-5 pb-1 pt-3 text-xs font-medium text-gray-500">{group.section}</p>
                {group.accounts.map(d => (
                  <button key={d.email} type="button"
                    onClick={async () => {
                      setDemoOpen(false);
                      setLoading(true);
                      try {
                        const u = await withWakeNotice(login(d.email, 'password123'));
                        toast.success(`Signed in as ${d.person}`);
                        navigate(getDashboard(u.role), { replace: true });
                      } catch (err) {
                        toast.error(signInError(err, true));
                      } finally { setLoading(false); }
                    }}
                    className="group flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-gray-50">
                    <Avatar name={d.person} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{d.label}</p>
                      <p className="text-xs text-gray-500">{d.email}</p>
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-gray-300 group-hover:text-gray-600" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthShell>
  );
}
