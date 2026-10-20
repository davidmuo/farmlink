import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Info, Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { Crop } from '../../types';
import PageHeader from '../../components/PageHeader';
import CropThumb from '../../components/CropThumb';
import api from '../../lib/api';

const QUALITY = ['Standard', 'Premium', 'Organic', 'Export Grade', 'Any'];

export default function PostDemand() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceNote, setRecurrenceNote] = useState('');
  const [form, setForm] = useState({
    cropId: '', quantity: '', pricePerUnit: '', qualityStandard: 'Standard',
    deliveryStart: '', deliveryEnd: '', notes: '',
  });

  useEffect(() => { api.get('/crops').then(r => setCrops(r.data)); }, []);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm(p => ({ ...p, [f]: value }));
    if (f === 'cropId') setSelectedCrop(crops.find(c => c.id === parseInt(value)) || null);
  };

  const totalValue = form.quantity && form.pricePerUnit
    ? parseFloat(form.quantity) * parseFloat(form.pricePerUnit) : 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.deliveryEnd && form.deliveryStart && new Date(form.deliveryEnd) < new Date(form.deliveryStart)) {
      toast.error('Delivery end must be after start'); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/demands', {
        cropId: parseInt(form.cropId), quantity: parseFloat(form.quantity),
        pricePerUnit: parseFloat(form.pricePerUnit), qualityStandard: form.qualityStandard,
        deliveryStart: form.deliveryStart, deliveryEnd: form.deliveryEnd, notes: form.notes || undefined,
        isRecurring,
        recurrenceNote: isRecurring && recurrenceNote ? recurrenceNote : undefined,
      });
      toast.success('Demand posted!');
      navigate(`/buyer/demands/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to post demand');
    } finally { setLoading(false); }
  };

  const Section = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <div className="grid gap-5 border-b border-gray-100 px-6 py-6 last:border-b-0 sm:grid-cols-[180px_1fr] sm:px-7">
      <div className="flex items-start gap-3 sm:block">
        <span className="tabular text-sm text-gray-400">{n}.</span>
        <p className="font-display text-[15px] font-semibold text-gray-900 sm:mt-1">{title}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  return (
    <div>
      <PageHeader back title="Post a demand" subtitle="Farmers will respond with supply commitments." />

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="card min-w-0 overflow-hidden lg:col-span-2">
          {Section({ n: 1, title: 'What you need', children: (
            <>
              <div className="form-group">
                <label className="label">Crop type *</label>
                <div className="flex items-center gap-3">
                  <CropThumb name={selectedCrop?.cropName} size={44} />
                  <select value={form.cropId} onChange={set('cropId')} className="input h-11" required>
                    <option value="">Choose a crop…</option>
                    {crops.map(c => <option key={c.id} value={c.id}>{c.cropName} ({c.category})</option>)}
                  </select>
                </div>
                {selectedCrop && (
                  <p className="hint flex items-center gap-1.5">
                    <Info size={12} className="text-gray-400" />
                    Season: {selectedCrop.seasonality} · {selectedCrop.storageRequirements}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Quantity (kg) *</label>
                  <input type="number" step="1" min="1" value={form.quantity} onChange={set('quantity')}
                    className="input h-11" required placeholder="e.g. 500" />
                </div>
                <div className="form-group">
                  <label className="label">Price per kg (₦) *</label>
                  <input type="number" step="0.5" min="1" value={form.pricePerUnit} onChange={set('pricePerUnit')}
                    className="input h-11" required placeholder="e.g. 80" />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Quality standard</label>
                <div className="flex flex-wrap gap-2">
                  {QUALITY.map(q => (
                    <button key={q} type="button"
                      onClick={() => setForm(p => ({ ...p, qualityStandard: q }))}
                      className={`chip ${form.qualityStandard === q ? 'chip-active' : ''}`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) })}

          {Section({ n: 2, title: 'Delivery window', children: (
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">From *</label>
                <input type="date" value={form.deliveryStart} onChange={set('deliveryStart')}
                  className="input h-11" required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="label">To *</label>
                <input type="date" value={form.deliveryEnd} onChange={set('deliveryEnd')}
                  className="input h-11" required min={form.deliveryStart || new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          ) })}

          {Section({ n: 3, title: 'Details', children: (
            <>
              <div className="form-group">
                <label className="label">Additional notes</label>
                <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={3}
                  placeholder="Packaging requirements, delivery address, special instructions…" />
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <label className="flex cursor-pointer select-none items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isRecurring}
                      onChange={e => setIsRecurring(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`h-6 w-11 rounded-full transition-colors ${isRecurring ? 'bg-forest-900' : 'bg-gray-300'}`}>
                      <div className={`absolute top-1 h-4 w-4 rounded-full shadow transition-all ${isRecurring ? 'left-6 bg-white' : 'left-1 bg-white'}`} />
                    </div>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                      <RefreshCw size={13} className="text-gray-400" />
                      Make this a recurring demand
                    </p>
                    <p className="text-xs text-gray-500">Repeat this order on a schedule</p>
                  </div>
                </label>
                {isRecurring && (
                  <div className="mt-4 animate-fade-in">
                    <label className="label">Recurrence note</label>
                    <input
                      type="text"
                      value={recurrenceNote}
                      onChange={e => setRecurrenceNote(e.target.value)}
                      className="input h-11"
                      placeholder="e.g. weekly, every Monday, twice a month…"
                    />
                  </div>
                )}
              </div>
            </>
          ) })}

          <div className="flex flex-col-reverse gap-3 bg-gray-50 px-5 py-4 sm:flex-row sm:px-7">
            <button type="button" onClick={() => navigate(-1)} className="btn-lg btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-lg btn-accent flex-1">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Posting…</> : <><PlusCircle size={16} /> Post demand</>}
            </button>
          </div>
        </form>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-gray-200 p-5">
              <CropThumb name={selectedCrop?.cropName} size={40} />
              <div>
                <p className="text-xs text-gray-500">Order preview</p>
                <p className="text-[15px] font-semibold text-gray-900">{selectedCrop?.cropName || 'Select a crop'}</p>
              </div>
            </div>
            <div className="space-y-2.5 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity</span>
                <span className="tabular font-medium">{form.quantity ? `${parseFloat(form.quantity).toLocaleString()} kg` : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Unit price</span>
                <span className="tabular font-medium">{form.pricePerUnit ? `₦ ${form.pricePerUnit}` : 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quality</span>
                <span className="font-medium">{form.qualityStandard}</span>
              </div>
              {isRecurring && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Recurrence</span>
                  <span className="font-medium">{recurrenceNote || 'Recurring'}</span>
                </div>
              )}
              <div className="!mt-4 flex items-baseline justify-between border-t border-gray-200 pt-4">
                <span className="text-gray-500">Total value</span>
                <span className="tabular text-xl font-semibold text-gray-900">
                  ₦ {totalValue > 0 ? totalValue.toLocaleString() : '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-gray-500" />
              <p className="text-sm font-semibold text-gray-900">Tips for better responses</p>
            </div>
            <ul className="space-y-2 text-[13px] leading-snug text-gray-600">
              {[
                'Set a fair market price to attract more farmers',
                'A wider delivery window gives farmers flexibility',
                'Specific quality standards avoid mismatches',
                'Notes about delivery location help planning',
              ].map(t => (
                <li key={t} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-500" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
