import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Layers, Building2, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';

const GREEN = '#6DFF8A';

interface CompletionItem { label: string; done: boolean; weight: number; }

function useProfileCompletion(user: any, demandCount: number) {
  const items: CompletionItem[] = [];

  // Common fields
  items.push({ label: 'Full name',    done: !!user?.name,  weight: 10 });
  items.push({ label: 'Email',        done: !!user?.email, weight: 10 });
  items.push({ label: 'Phone number', done: !!user?.phone, weight: 15 });

  if (user?.farmer) {
    items.push({ label: 'Farm location', done: !!user.farmer.farmLocation, weight: 15 });
    items.push({ label: 'Farm size',     done: !!user.farmer.farmSize,     weight: 15 });
    const crops: string[] = user.farmer.cropsGrown ? (() => { try { return JSON.parse(user.farmer.cropsGrown); } catch { return []; } })() : [];
    items.push({ label: 'Crops grown',   done: crops.length > 0,           weight: 20 });
    items.push({ label: 'Farm records',  done: false,                       weight: 15 }); // requires async fetch; default false
  }

  if (user?.buyer) {
    items.push({ label: 'Business name', done: !!user.buyer.businessName, weight: 20 });
    items.push({ label: 'Business type', done: !!user.buyer.businessType, weight: 20 });
    items.push({ label: 'Posted a demand', done: demandCount > 0,         weight: 10 });
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const earned      = items.filter(i => i.done).reduce((s, i) => s + i.weight, 0);
  const pct         = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
  const missing     = items.filter(i => !i.done);

  return { pct, missing };
}

export default function Profile() {
  const { user } = useAuth();
  const [saving, setSaving]       = useState(false);
  const [demandCount, setDemandCount] = useState(0);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    farmLocation: user?.farmer?.farmLocation || '',
    farmSize: String(user?.farmer?.farmSize || ''),
    cropsGrown: user?.farmer?.cropsGrown ? (() => { try { return JSON.parse(user.farmer.cropsGrown).join(', '); } catch { return ''; } })() : '',
    businessName: user?.buyer?.businessName || '',
    businessType: user?.buyer?.businessType || '',
  });

  useEffect(() => {
    if (user?.buyer) {
      api.get('/demands').then(r => setDemandCount(r.data.length)).catch(() => {});
    }
  }, [user]);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name: form.name, phone: form.phone });
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const cropsGrown: string[] = user?.farmer?.cropsGrown ? (() => { try { return JSON.parse(user.farmer.cropsGrown); } catch { return []; } })() : [];

  const { pct, missing } = useProfileCompletion(user, demandCount);

  return (
    <div className="max-w-2xl">
      <PageHeader title="Profile & Settings" subtitle="Manage your account information" />

      <div className="space-y-5">
        {/* Profile completion card */}
        <div className="border border-gray-100 rounded-2xl p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Profile Completion
            </p>
            <span className="text-xl font-black text-gray-900 tracking-tight">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: GREEN }}
            />
          </div>
          {missing.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 mb-2">Complete your profile:</p>
              {missing.map(item => (
                <button key={item.label}
                  className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors w-full text-left">
                  <AlertCircle size={12} className="text-gray-300 shrink-0" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-gray-300">+{item.weight}%</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
              <CheckCircle2 size={14} />
              Profile complete!
            </div>
          )}
        </div>

        {/* Role card */}
        <div className="card-p flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-700">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`badge mt-1.5 ${user?.role === 'buyer' ? 'badge-blue' : user?.role === 'farmer' ? 'badge-green' : 'badge-purple'}`}>
              <Shield size={10} /> {user?.role}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="card-p space-y-4">
          <h2 className="font-semibold text-gray-900">Personal Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Full name</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={form.name} onChange={set('name')} className="input pl-9" placeholder="Your name" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Phone number</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={form.phone} onChange={set('phone')} className="input pl-9" placeholder="+234…" />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={user?.email} disabled className="input pl-9 bg-gray-50 text-gray-400 cursor-not-allowed" />
            </div>
            <p className="hint">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={saving} className="btn-md btn-primary">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Role-specific info */}
        {user?.farmer && (
          <div className="card-p space-y-3">
            <h2 className="font-semibold text-gray-900">Farm Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="text-gray-400" />
                <span>{user.farmer.farmLocation || 'No location set'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Layers size={15} className="text-gray-400" />
                <span>{user.farmer.farmSize} acres</span>
              </div>
            </div>
            {cropsGrown.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Crops grown</p>
                <div className="flex flex-wrap gap-1.5">
                  {cropsGrown.map((c: string) => <span key={c} className="badge-green">{c}</span>)}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-400">To update farm details, please contact support.</p>
          </div>
        )}

        {user?.buyer && (
          <div className="card-p space-y-3">
            <h2 className="font-semibold text-gray-900">Business Information</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Building2 size={15} className="text-blue-600" />
                <span>{user.buyer.businessName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield size={15} className="text-blue-600" />
                <span>{user.buyer.businessType}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">To update business details, please contact support.</p>
          </div>
        )}

        {/* Danger zone */}
        <div className="card-p border-red-100">
          <h2 className="font-semibold text-red-700 mb-1">Account</h2>
          <p className="text-sm text-gray-500 mb-3">Manage your account session</p>
          <button
            onClick={() => { if (confirm('Sign out of FarmLink?')) { window.location.href = '/login'; } }}
            className="btn-md btn-secondary text-red-600 border-red-200 hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
