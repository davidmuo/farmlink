import { useEffect, useState, FormEvent } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { BookOpen, PlusCircle, Trash2, Layers, CalendarDays, X } from 'lucide-react';
import { FarmRecord, Crop } from '../../types';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import StatTile from '../../components/StatTile';
import CropThumb from '../../components/CropThumb';
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
  const selectedCropName = crops.find(c => String(c.id) === form.cropId)?.cropName;

  return (
    <div>
      <PageHeader
        title="Farm Records"
        subtitle="Track your planting activities and crop schedule."
        action={
          <button onClick={() => setShowForm(s => !s)} className={showForm ? 'btn-lg btn-secondary' : 'btn-lg btn-accent'}>
            {showForm ? <><X size={16} /> Cancel</> : <><PlusCircle size={16} /> Add record</>}
          </button>
        }
      />

      {records.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatTile label="Total area" value={<>{totalArea.toFixed(1)} <span className="text-base font-normal text-gray-500">acres</span></>} />
          <StatTile label="Crop types" value={Object.keys(cropCounts).length} />
          <div className="card p-5">
            <p className="stat-label mb-3">By crop</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(cropCounts).map(([crop, area]) => (
                <span key={crop} className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-gray-700">
                  <CropThumb name={crop} size={20} rounded="full" /> {crop} · {area}ac
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="card mb-6 animate-slide-up overflow-hidden">
          <div className="card-header">
            <p className="card-title">New farm record</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="form-group">
                <label className="label">Crop *</label>
                <div className="flex items-center gap-3">
                  <CropThumb name={selectedCropName} size={42} />
                  <select value={form.cropId} onChange={set('cropId')} className="input h-11" required>
                    <option value="">Select crop…</option>
                    {crops.map(c => <option key={c.id} value={c.id}>{c.cropName}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Planting date *</label>
                <input type="date" value={form.plantingDate} onChange={set('plantingDate')} className="input h-11" required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Area planted (acres) *</label>
              <input type="number" step="0.1" min="0.1" value={form.areaPlanted} onChange={set('areaPlanted')} className="input h-11" required placeholder="e.g. 2.5" />
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={2}
                placeholder="Fertilizer used, irrigation notes, soil conditions…" />
            </div>
            <button type="submit" disabled={submitting} className="btn-lg btn-primary">
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
          action={<button onClick={() => setShowForm(true)} className="btn-md btn-accent"><PlusCircle size={15} /> Add your first record</button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {records.map(r => (
            <div key={r.id} className="card group flex items-start gap-4 p-5">
              <CropThumb name={r.crop?.cropName} size={56} rounded="2xl" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] font-semibold tracking-tight text-gray-900">{r.crop?.cropName}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  <span className="inline-flex items-center gap-1"><Layers size={12} className="text-gray-400" />{r.areaPlanted} acres</span>
                  <span className="inline-flex items-center gap-1"><CalendarDays size={12} className="text-gray-400" />Planted {format(new Date(r.plantingDate), 'MMM d, yyyy')}</span>
                </div>
                {r.notes && <p className="mt-2.5 rounded-xl bg-gray-50 px-3 py-2 text-xs italic leading-relaxed text-gray-600">"{r.notes}"</p>}
                <p className="mt-2 text-[11px] text-gray-400">Added {format(new Date(r.createdAt), 'MMM d, yyyy')}</p>
              </div>
              <button onClick={() => deleteRecord(r.id)} title="Delete record"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
