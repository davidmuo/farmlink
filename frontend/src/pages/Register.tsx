import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GREEN = '#6DFF8A';
const BUSINESS_TYPES = ['Hotel', 'Restaurant', 'School', 'Hospital', 'Supermarket', 'Catering', 'NGO', 'Other'];
const CROP_OPTIONS = ['Tomatoes', 'Cabbage', 'Maize', 'Plantain', 'Yam', 'Cassava', 'Pepper', 'Onions', 'Spinach', 'Carrots'];

type Role = 'farmer' | 'buyer';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '', password: '',
    name: '', phone: '', role: '' as Role | '',
    businessName: '', businessType: 'Restaurant',
    farmLocation: '', farmSize: '', cropsGrown: [] as string[],
  });

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const toggleCrop = (crop: string) =>
    setForm(p => ({
      ...p,
      cropsGrown: p.cropsGrown.includes(crop)
        ? p.cropsGrown.filter(c => c !== crop)
        : [...p.cropsGrown, crop],
    }));

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, role: form.role as Role,
        ...(form.role === 'buyer' && {
          businessName: form.businessName || form.name,
          businessType: form.businessType,
        }),
        ...(form.role === 'farmer' && {
          farmLocation: form.farmLocation,
          farmSize: parseFloat(form.farmSize) || 0,
          cropsGrown: form.cropsGrown,
        }),
      });
      toast.success('Welcome to FarmLink!');
      navigate(form.role === 'buyer' ? '/buyer' : '/farmer', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Top bar */}
      <div className="px-8 py-6 flex items-center justify-between">
        <Link to="/">
          <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-base font-bold text-gray-900 tracking-tight">
            FarmLink
          </span>
        </Link>
        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i + 1 <= step ? '#111827' : '#e5e7eb' }} />
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-[380px]">

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">Step 1 of 3</p>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">Create your account</h1>
              <p className="text-sm text-gray-400 mb-8 text-center">Set your email and password to continue</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
                  <input type="email" value={form.email} onChange={set('email')} required
                    placeholder="you@example.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <input type="password" value={form.password} onChange={set('password')} required minLength={6}
                    placeholder="At least 6 characters"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                </div>
                <button onClick={() => {
                    if (!form.email || form.password.length < 6) {
                      toast.error('Enter a valid email and password (min 6 chars)'); return;
                    }
                    next();
                  }}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl text-gray-950 hover:opacity-90 transition-opacity mt-1"
                  style={{ background: GREEN }}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>

              <p className="text-center text-sm text-gray-400 mt-5">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-gray-900 hover:text-gray-700">Sign in</Link>
              </p>
            </div>
          )}

          {/* ── Step 2: Identity + Role ── */}
          {step === 2 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">Step 2 of 3</p>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">About you</h1>
              <p className="text-sm text-gray-400 mb-8 text-center">Tell us who you are and how you'll use FarmLink</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
                  <input value={form.name} onChange={set('name')} required
                    placeholder="Chidi Okafor"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone <span className="text-gray-300">(optional)</span></label>
                  <input value={form.phone} onChange={set('phone')}
                    placeholder="+234 800 000 0000"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">I am joining as a…</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: 'farmer', title: 'Farmer',   sub: 'I grow and sell produce' },
                      { value: 'buyer',  title: 'Buyer',    sub: 'I source produce for my org' },
                    ] as const).map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))}
                        className="p-4 rounded-xl border-2 text-left transition-all"
                        style={form.role === r.value
                          ? { borderColor: '#111827', background: '#f9fafb' }
                          : { borderColor: '#e5e7eb', background: '#ffffff' }}>
                        <p className="font-bold text-sm text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{r.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={() => {
                    if (!form.name) { toast.error('Enter your name'); return; }
                    if (!form.role) { toast.error('Select a role'); return; }
                    next();
                  }}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl text-gray-950 hover:opacity-90 transition-opacity mt-1"
                  style={{ background: GREEN }}>
                  Continue <ArrowRight size={15} />
                </button>

                <button onClick={back}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Role profile ── */}
          {step === 3 && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">Step 3 of 3</p>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1 text-center">
                {form.role === 'buyer' ? 'Your organisation' : 'Your farm'}
              </h1>
              <p className="text-sm text-gray-400 mb-8 text-center">
                {form.role === 'buyer'
                  ? "Help farmers understand who they're supplying to"
                  : 'Help buyers find the right crops from the right farms'}
              </p>

              <div className="space-y-3">
                {form.role === 'buyer' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Business name</label>
                      <input value={form.businessName} onChange={set('businessName')}
                        placeholder="Sunrise Hotels Ltd"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Business type</label>
                      <select value={form.businessType} onChange={set('businessType')}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors">
                        {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </>
                )}

                {form.role === 'farmer' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Farm location</label>
                      <input value={form.farmLocation} onChange={set('farmLocation')}
                        placeholder="e.g. Ifo, Ogun State"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Farm size (hectares)</label>
                      <input type="number" step="0.1" value={form.farmSize} onChange={set('farmSize')}
                        placeholder="e.g. 5.5"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        What do you grow? <span className="text-gray-400">(select all that apply)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CROP_OPTIONS.map(crop => (
                          <button key={crop} type="button" onClick={() => toggleCrop(crop)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
                            style={form.cropsGrown.includes(crop)
                              ? { borderColor: '#111827', background: '#111827', color: '#fff' }
                              : { borderColor: '#e5e7eb', background: '#fff', color: '#374151' }}>
                            {crop}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Don't see your crop? You can add more later.</p>
                    </div>
                  </>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3.5 rounded-xl text-gray-950 hover:opacity-90 transition-opacity mt-1"
                  style={{ background: GREEN }}>
                  {loading ? 'Creating account…' : <><span>Create account</span><ArrowRight size={15} /></>}
                </button>

                <button onClick={back}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 py-2 transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-[11px] text-gray-400">
          By continuing you agree to our{' '}
          <Link to="/terms" className="hover:text-gray-700 transition-colors underline underline-offset-2">Terms of service</Link>
          {' and '}
          <Link to="/privacy" className="hover:text-gray-700 transition-colors underline underline-offset-2">Privacy policy</Link>
        </p>
      </div>
    </div>
  );
}
