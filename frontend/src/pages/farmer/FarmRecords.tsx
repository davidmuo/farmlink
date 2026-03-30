import { useEffect, useState, FormEvent } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { BookOpen, PlusCircle, Trash2, MapPin, Layers, Leaf } from 'lucide-react';
import { FarmRecord, Crop } from '../../types';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';

export default function FarmRecords() {
  const [records, setRecords] = useState<FarmRecord[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ cropId: '', plantingDate: '', areaPlanted: '', notes: '' });

  const load = () => api.get('/farm-records').then(r => setRecords(r.data));

  useEffect(() => {
    Promise.all([load(), api.get('/crops').then(r => setCrops(r.data))]).finally(() => setLoading(false));
  }, []);

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/farm-records', { cropId: parseInt(form.cropId), plantingDate: form.plantingDate, areaPlanted: parseFloat(form.areaPlanted), notes: form.notes || undefined });
      toast.success('Farm record saved');
      setShowForm(false);
      setForm({ cropId: '', plantingDate: '', areaPlanted: '', notes: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const deleteRecord = async (id: number) => {
    if (!confirm('Delete this record?')) return;
    try {
      await api.delete(`/farm-records/${id}`);
      toast.success('Record deleted');
      setRecords(r => r.filter(rec => rec.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  const totalArea = records.reduce((s, r) => s + r.areaPlanted, 0);
  const cropCounts = records.reduce((acc: Record<string, number>, r) => {
    const name = r.crop?.cropName || 'Unknown';
    acc[name] = (acc[name] || 0) + r.areaPlanted;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Farm Records"
        subtitle="Track your planting activities and crop schedule"
        action={
          <button onClick={() => setShowForm(s => !s)} className="btn-md btn-primary">
            <PlusCircle size={15} /> {showForm ? 'Cancel' : 'Add record'}
          </button>
        }
      />

      {records.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="card-p">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Total area</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{totalArea.toFixed(1)} <span className="text-sm font-normal text-gray-400">acres</span></p>
          </div>
          <div className="card-p">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Crop types</p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">{Object.keys(cropCounts).length}</p>
          </div>
          <div className="card-p">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">By crop</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(cropCounts).map(([crop, area]) => (
                <span key={crop} className="badge-gray">{crop} · {area}ac</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card-p mb-6 border-2 border-gray-200 animate-slide-up">
          <h3 className="font-semibold text-gray-900 mb-4">New Farm Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Crop *</label>
                <select value={form.cropId} onChange={set('cropId')} className="input" required>
                  <option value="">Select crop...</option>
                  {crops.map(c => <option key={c.id} value={c.id}>{c.cropName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Planting date *</label>
                <input type="date" value={form.plantingDate} onChange={set('plantingDate')} className="input" required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Area planted (acres) *</label>
              <input type="number" step="0.1" min="0.1" value={form.areaPlanted} onChange={set('areaPlanted')} className="input" required placeholder="e.g. 2.5" />
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={2}
                placeholder="Fertilizer used, irrigation notes, soil conditions..." />
            </div>
            <button type="submit" disabled={submitting} className="btn-md btn-primary">
              {submitting ? 'Saving…' : 'Save record'}
            </button>
          </form>
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No farm records yet"
          description="Start tracking your planting activities to monitor your farm's productivity."
          action={<button onClick={() => setShowForm(true)} className="btn-md btn-primary"><PlusCircle size={15} /> Add your first record</button>}
        />
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="card-p flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Leaf size={15} className="text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{r.crop?.cropName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    <Layers size={12} className="inline mr-1" />{r.areaPlanted} acres
                    {' · '}
                    <MapPin size={12} className="inline mr-1" />Planted {format(new Date(r.plantingDate), 'MMM d, yyyy')}
                  </p>
                  {r.notes && <p className="text-xs text-gray-400 mt-1 italic">"{r.notes}"</p>}
                  <p className="text-xs text-gray-300 mt-1">Added {format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
                </div>
              </div>
              <button onClick={() => deleteRecord(r.id)} className="btn-sm btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
