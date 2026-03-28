import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusCircle, Info, Lightbulb, RefreshCw } from 'lucide-react';
import { Crop } from '../../types';
import PageHeader from '../../components/PageHeader';
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

  return (
    <div>
      <PageHeader back title="Post a Demand" subtitle="Farmers will respond with supply commitments" />

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 card-p space-y-5">
          {/* Crop */}
          <div className="form-group">
            <label className="label">Crop type *</label>
            <select value={form.cropId} onChange={set('cropId')} className="input" required>
              <option value="">Choose a crop…</option>
              {crops.map(c => <option key={c.id} value={c.id}>{c.cropName} — {c.category}</option>)}
            </select>
            {selectedCrop && (
              <p className="hint flex items-center gap-1 mt-1.5">
                <Info size={11} className="text-gray-400" />
                Season: {selectedCrop.seasonality} · {selectedCrop.storageRequirements}
              </p>
            )}
          </div>

          {/* Quantity + Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Quantity (kg) *</label>
              <input type="number" step="1" min="1" value={form.quantity} onChange={set('quantity')}
                className="input" required placeholder="e.g. 500" />
            </div>
            <div className="form-group">
              <label className="label">Price per kg (₦) *</label>
              <input type="number" step="0.5" min="1" value={form.pricePerUnit} onChange={set('pricePerUnit')}
                className="input" required placeholder="e.g. 80" />
            </div>
          </div>

          {/* Quality */}
          <div className="form-group">
            <label className="label">Quality standard</label>
            <div className="flex flex-wrap gap-2">
              {QUALITY.map(q => (
                <button key={q} type="button"
                  onClick={() => setForm(p => ({ ...p, qualityStandard: q }))}
                  className={`px-3.5 py-2 rounded-full border text-xs font-medium transition-all ${
                    form.qualityStandard === q
                      ? ''
                      : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'
                  }`}
                  style={form.qualityStandard === q ? { background: '#6DFF8A', color: '#111827', borderColor: '#6DFF8A' } : {}}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery window */}
          <div className="form-group">
            <label className="label">Delivery window *</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1.5">From</p>
                <input type="date" value={form.deliveryStart} onChange={set('deliveryStart')}
                  className="input" required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1.5">To</p>
                <input type="date" value={form.deliveryEnd} onChange={set('deliveryEnd')}
                  className="input" required min={form.deliveryStart || new Date().toISOString().split('T')[0]} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="label">Additional notes</label>
            <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={3}
              placeholder="Packaging requirements, delivery address, special instructions…" />
          </div>

          {/* Recurring demand */}
          <div className="form-group">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${isRecurring ? '' : 'bg-gray-200'}`}
                  style={isRecurring ? { background: '#6DFF8A' } : {}}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full shadow transition-transform ${isRecurring ? 'left-5 bg-gray-900' : 'left-1 bg-white'}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-gray-400" />
                  Make this a recurring demand
                </p>
                <p className="text-xs text-gray-400">Repeat this order on a schedule</p>
              </div>
            </label>
            {isRecurring && (
              <div className="mt-3">
                <label className="label">Recurrence note</label>
                <input
                  type="text"
                  value={recurrenceNote}
                  onChange={e => setRecurrenceNote(e.target.value)}
                  className="input"
                  placeholder="e.g. weekly, every Monday, twice a month…"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => navigate(-1)} className="flex-1 flex items-center justify-center font-bold text-sm py-3 rounded-xl text-gray-600 border border-gray-200 bg-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl text-gray-900 disabled:opacity-50" style={{ background: '#6DFF8A' }}>
              <PlusCircle size={15} /> {loading ? 'Posting…' : 'Post Demand'}
            </button>
          </div>
        </form>

        {/* Sidebar */}
        <div className="space-y-4">
          {totalValue > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Order Preview</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity</span>
                  <span className="font-medium">{parseFloat(form.quantity).toLocaleString()} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit price</span>
                  <span className="font-medium">₦ {form.pricePerUnit}</span>
                </div>
                {isRecurring && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recurrence</span>
                    <span className="font-medium text-gray-700">{recurrenceNote || 'Recurring'}</span>
                  </div>
                )}
                <div className="divider my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-700">Total value</span>
                  <span className="font-bold text-gray-900 text-xl">₦ {totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Lightbulb size={14} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-600">Tips for better responses</p>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>• Set a fair market price to attract more farmers</li>
              <li>• A wider delivery window gives farmers flexibility</li>
              <li>• Specific quality standards avoid mismatches</li>
              <li>• Notes about delivery location help planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
