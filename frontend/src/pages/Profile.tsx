import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Layers, Building2, Shield, CheckCircle2, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import CropThumb from '../components/CropThumb';
import api from '../lib/api';

interface CompletionItem { label: string; done: boolean; weight: number; }

function useProfileCompletion(user: any, demandCount: number) {
  const items: CompletionItem[] = [];

  items.push({ label: 'Full name',    done: !!user?.name,  weight: 10 });
  items.push({ label: 'Email',        done: !!user?.email, weight: 10 });
  items.push({ label: 'Phone number', done: !!user?.phone, weight: 15 });

  if (user?.farmer) {
    items.push({ label: 'Farm location', done: !!user.farmer.farmLocation, weight: 15 });
    items.push({ label: 'Farm size',     done: !!user.farmer.farmSize,     weight: 15 });
    const crops: string[] = user.farmer.cropsGrown ? (() => { try { return JSON.parse(user.farmer.cropsGrown); } catch { return []; } })() : [];
    items.push({ label: 'Crops grown',   done: crops.length > 0,           weight: 20 });
    items.push({ label: 'Farm records',  done: false,                       weight: 15 });
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

  const roleBadge = user?.role === 'buyer' ? 'badge-blue' : user?.role === 'farmer' ? 'badge-green' : 'badge-purple';

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Profile & Settings" subtitle="Manage your account information." />

      <div className="card mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <Avatar name={user?.name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`${roleBadge} capitalize`}><Shield size={11} /> {user?.role}</span>
            {user?.buyer?.businessName && <span className="badge-gray"><Building2 size={11} /> {user.buyer.businessName}</span>}
            {user?.farmer?.farmLocation && <span className="badge-gray"><MapPin size={11} /> {user.farmer.farmLocation}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <form onSubmit={handleSave} className="card overflow-hidden">
            <div className="card-header">
              <p className="card-title">Personal information</p>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-group">
                  <label className="label">Full name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.name} onChange={set('name')} className="input h-11 pl-10" placeholder="Your name" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Phone number</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={form.phone} onChange={set('phone')} className="input h-11 pl-10" placeholder="+234…" />
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={user?.email} disabled className="input h-11 pl-10" />
                </div>
                <p className="hint">Email cannot be changed</p>
              </div>
            </div>
            <div className="flex justify-end border-t border-gray-100 bg-gray-50/60 px-6 py-4">
              <button type="submit" disabled={saving} className="btn-md btn-primary">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          {user?.farmer && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <p className="card-title">Farm information</p>
              </div>
              <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
                <div className="flex items-center gap-3 bg-white px-6 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><MapPin size={15} /></span>
                  <div><p className="stat-label">Location</p><p className="text-sm font-semibold text-gray-900">{user.farmer.farmLocation || 'No location set'}</p></div>
                </div>
                <div className="flex items-center gap-3 bg-white px-6 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Layers size={15} /></span>
                  <div><p className="stat-label">Farm size</p><p className="text-sm font-semibold text-gray-900">{user.farmer.farmSize} acres</p></div>
                </div>
              </div>
              {cropsGrown.length > 0 && (
                <div className="border-t border-gray-100 p-6">
                  <p className="stat-label mb-3">Crops grown</p>
                  <div className="flex flex-wrap gap-2">
                    {cropsGrown.map((c: string) => (
                      <span key={c} className="inline-flex h-9 items-center gap-2 rounded-full border border-gray-200 pl-1 pr-3.5 text-sm text-gray-800">
                        <CropThumb name={c} size={28} rounded="full" /> {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">To update farm details, please contact support.</p>
            </div>
          )}

          {user?.buyer && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <p className="card-title">Business information</p>
              </div>
              <div className="grid gap-px bg-gray-100 sm:grid-cols-2">
                <div className="flex items-center gap-3 bg-white px-6 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Building2 size={15} /></span>
                  <div><p className="stat-label">Business</p><p className="text-sm font-semibold text-gray-900">{user.buyer.businessName}</p></div>
                </div>
                <div className="flex items-center gap-3 bg-white px-6 py-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500"><Shield size={15} /></span>
                  <div><p className="stat-label">Type</p><p className="text-sm font-semibold text-gray-900">{user.buyer.businessType}</p></div>
                </div>
              </div>
              <p className="border-t border-gray-100 px-6 py-3 text-xs text-gray-500">To update business details, please contact support.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {user?.role !== 'admin' && (
            <div className="card p-6">
              <div className="flex items-baseline justify-between"><p className="card-title">Profile completion</p><span className="tabular text-sm font-semibold text-gray-900">{pct}%</span></div>
              <div className="mb-4 mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-forest-600 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              {missing.length > 0 ? (
                <div className="space-y-1">
                  <p className="mb-2 text-xs font-medium text-gray-500">Complete your profile:</p>
                  {missing.map(item => (
                    <button key={item.label}
                      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400"><Plus size={11} /></span>
                      <span className="flex-1">{item.label}</span>
                      <span className="tabular text-xs font-semibold text-forest-600">+{item.weight}%</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-forest-700">
                  <CheckCircle2 size={16} />
                  Profile complete!
                </div>
              )}
            </div>
          )}

          <div className="card p-6">
            <p className="card-title">Account</p>
            <p className="mb-4 mt-1 text-sm text-gray-500">Manage your account session.</p>
            <button
              onClick={() => { if (confirm('Sign out of FarmLink?')) { window.location.href = '/login'; } }}
              className="btn-md btn-secondary w-full text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
