import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Sprout, Building2, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';
import CropThumb from '../components/CropThumb';
import { PHOTOS } from '../lib/media';

const BUSINESS_TYPES = ['Hotel', 'Restaurant', 'School', 'Hospital', 'Supermarket', 'Catering', 'NGO', 'Other'];
const CROP_OPTIONS = ['Tomatoes', 'Cabbage', 'Maize', 'Plantain', 'Yam', 'Cassava', 'Pepper', 'Onions', 'Spinach', 'Carrots'];
const STEP_LABELS = ['Account', 'About you', 'Profile'];

type Role = 'farmer' | 'buyer';

const inputCls = 'input h-11';

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
      toast.error(
        !err.response ? (navigator.onLine
          ? "FarmLink's server isn't responding right now. Please try again in a minute."
          : "You're offline. Check your connection and try again.")
        : err.response.status >= 500 ? 'The server is having trouble right now. Please try again shortly.'
        : err.response?.data?.error || 'Registration failed'
      );
    } finally { setLoading(false); }
  };

  const totalSteps = 3;

  const Heading = ({ title, sub }: { title: React.ReactNode; sub: string }) => (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-gray-600">{sub}</p>
    </div>
  );

  const BackButton = () => (
    <button onClick={back}
      className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
      <ArrowLeft size={14} /> Back
    </button>
  );

  return (
    <AuthShell
      photo={PHOTOS.harvestBasket}
      photoAlt="A smiling farmer carrying a basket of fresh harvest on her back"
      headline="Grow for buyers you already know."
      caption="Free forever for farmers. Buyers pay only on confirmed value."
      topRight={
        <p className="text-sm text-gray-500">
          Have an account? <Link to="/login" className="font-semibold text-forest-900 hover:underline">Sign in</Link>
        </p>
      }
      footer={
        <>
          By continuing you agree to our{' '}
          <Link to="/terms" className="underline underline-offset-2 hover:text-gray-800">Terms of service</Link>
          {' and '}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-gray-800">Privacy policy</Link>
        </>
      }
    >
      {/* Progress */}
      <div className="mb-10">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i + 1 <= step ? 'bg-forest-900' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className="mt-3 text-xs font-medium text-gray-500">
          Step {step} of {totalSteps} · <span className="text-gray-900">{STEP_LABELS[step - 1]}</span>
        </p>
      </div>

      {/* ── Step 1: Account ── */}
      {step === 1 && (
        <div key="s1" className="animate-fade-in">
          <Heading title="Create your account" sub="Set your email and password to continue." />
          <div className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={set('email')} required
                placeholder="you@example.com" autoComplete="email" className={inputCls} />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6}
                placeholder="At least 6 characters" autoComplete="new-password" className={inputCls} />
            </div>
            <button onClick={() => {
                if (!form.email || form.password.length < 6) {
                  toast.error('Enter a valid email and password (min 6 chars)'); return;
                }
                next();
              }}
              className="btn-lg btn-primary mt-2 w-full">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Identity + Role ── */}
      {step === 2 && (
        <div key="s2" className="animate-fade-in">
          <Heading title="About you" sub="Tell us who you are and how you'll use FarmLink." />
          <div className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input value={form.name} onChange={set('name')} required placeholder="Chidi Okafor" autoComplete="name" className={inputCls} />
            </div>
            <div>
              <label className="label">Phone <span className="font-normal text-gray-400">(optional)</span></label>
              <input value={form.phone} onChange={set('phone')} placeholder="+234 800 000 0000" autoComplete="tel" className={inputCls} />
            </div>

            <div>
              <label className="label">I am joining as a…</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'farmer', title: 'Farmer', sub: 'I grow and sell produce',     icon: Sprout },
                  { value: 'buyer',  title: 'Buyer',  sub: 'I source produce for my org', icon: Building2 },
                ] as const).map(r => {
                  const active = form.role === r.value;
                  return (
                    <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))}
                      className={`option-card ${active ? 'option-card-active' : ''}`}>
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${active ? 'bg-forest-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <r.icon size={18} />
                      </span>
                      <p className="mt-3 font-display text-[15px] font-semibold text-gray-900">{r.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{r.sub}</p>
                      {active && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-forest-800 text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={() => {
                if (!form.name) { toast.error('Enter your name'); return; }
                if (!form.role) { toast.error('Select a role'); return; }
                next();
              }}
              className="btn-lg btn-primary mt-2 w-full">
              Continue <ArrowRight size={16} />
            </button>
            <BackButton />
          </div>
        </div>
      )}

      {/* ── Step 3: Role profile ── */}
      {step === 3 && (
        <div key="s3" className="animate-fade-in">
          <Heading
            title={form.role === 'buyer'
              ? 'Your organisation'
              : 'Your farm'}
            sub={form.role === 'buyer'
              ? "Help farmers understand who they're supplying to."
              : 'Help buyers find the right crops from the right farms.'}
          />

          <div className="space-y-4">
            {form.role === 'buyer' && (
              <>
                <div>
                  <label className="label">Business name</label>
                  <input value={form.businessName} onChange={set('businessName')} placeholder="Sunrise Hotels Ltd" className={inputCls} />
                </div>
                <div>
                  <label className="label">Business type</label>
                  <select value={form.businessType} onChange={set('businessType')} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </>
            )}

            {form.role === 'farmer' && (
              <>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-3">
                    <label className="label">Farm location</label>
                    <input value={form.farmLocation} onChange={set('farmLocation')} placeholder="e.g. Ifo, Ogun State" className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Size (ha)</label>
                    <input type="number" step="0.1" value={form.farmSize} onChange={set('farmSize')} placeholder="e.g. 5.5" className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="label">
                    What do you grow? <span className="font-normal text-gray-400">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CROP_OPTIONS.map(crop => {
                      const active = form.cropsGrown.includes(crop);
                      return (
                        <button key={crop} type="button" onClick={() => toggleCrop(crop)}
                          className={`inline-flex h-9 items-center gap-2 rounded-full border pl-1 pr-3.5 text-[13px] font-medium transition-all ${
                            active
                              ? 'border-forest-900 bg-forest-900 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}>
                          <CropThumb name={crop} size={26} rounded="full" />
                          {crop}
                          {active && <Check size={13} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                  <p className="hint">Don't see your crop? You can add more later.</p>
                </div>
              </>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="btn-lg btn-primary mt-2 w-full">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}
            </button>
            <BackButton />
          </div>
        </div>
      )}
    </AuthShell>
  );
}
