import { useEffect, useState, FormEvent } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Send, Phone, ArrowDownLeft, ArrowUpRight, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import api from '../../lib/api';

interface SmsLog {
  id:          number;
  direction:   'outbound' | 'inbound';
  phoneNumber: string;
  farmerName?: string;
  message:     string;
  status:      string;
  demandId?:   number;
  createdAt:   string;
}

const EXAMPLES = [
  { label: 'Accept full order',    text: 'ACCEPT FL1' },
  { label: 'Accept 200 kg partial',text: 'ACCEPT FL1 200' },
  { label: 'Cancel commitment',    text: 'CANCEL FL1' },
  { label: 'Check my orders',      text: 'STATUS' },
];

export default function SmsInbox() {
  const { user } = useAuth();
  const [logs, setLogs]       = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText]       = useState('');
  const [reply, setReply]     = useState('');
  const [sending, setSending] = useState(false);

  const fetchLogs = () =>
    api.get('/sms/inbox').then(r => setLogs(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchLogs(); }, []);

  const simulate = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setReply('');
    try {
      const r = await api.post('/sms/simulate', { text: text.trim() });
      setReply(r.data.reply);
      setText('');
      fetchLogs();
    } catch { setReply('Error — check your connection.'); }
    finally   { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">SMS Inbox</h1>
          <p className="page-subtitle mt-1">
            Farmers receive alerts and can reply directly from any phone — no internet needed.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold shrink-0">
          <Phone size={11} /> {user?.phone}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">

        <div className="space-y-3">
          <h2 className="section-title">Message history</h2>

          {loading ? <Spinner /> : logs.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No messages yet"
              description="When buyers post demands matching your crops, you'll receive an SMS alert here." />
          ) : (
            <div className="space-y-2">
              {[...logs].reverse().map(log => {
                const isOut = log.direction === 'outbound';
                return (
                  <div key={log.id} className={`flex gap-3 ${isOut ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${isOut ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {isOut ? 'FL' : (user?.name?.charAt(0) || 'F')}
                    </div>
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${isOut ? 'bg-brand-50 border border-brand-100' : 'bg-gray-900 text-white'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isOut ? '' : 'flex-row-reverse'}`}>
                        <span className={`text-[10px] font-semibold ${isOut ? 'text-brand-600' : 'text-gray-400'}`}>
                          {isOut ? 'FarmLink' : 'You'}
                        </span>
                        {isOut ? <ArrowDownLeft size={10} className="text-brand-400" /> : <ArrowUpRight size={10} className="text-gray-500" />}
                        <span className={`text-[10px] ${isOut ? 'text-gray-400' : 'text-gray-500'}`}>
                          {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isOut ? 'text-gray-700' : 'text-white'}`}>
                        {log.message}
                      </p>
                      {log.demandId && (
                        <span className={`inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${isOut ? 'bg-brand-100 text-brand-600' : 'bg-white/10 text-white/70'}`}>
                          FL{log.demandId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-p">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Send size={14} className="text-brand-600" /> Simulate SMS reply
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Type what you'd SMS from your phone. The backend processes it exactly as a real SMS reply would be handled.
            </p>

            <form onSubmit={simulate} className="space-y-3">
              <div className="relative">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="input font-mono"
                  placeholder="e.g. ACCEPT FL1"
                  autoComplete="off"
                />
              </div>
              <button type="submit" disabled={sending || !text.trim()} className="btn-md btn-primary w-full">
                {sending ? 'Sending…' : <><Send size={14} /> Send SMS</>}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick send</p>
              <div className="grid grid-cols-2 gap-2">
                {EXAMPLES.map(ex => (
                  <button key={ex.text} type="button"
                    onClick={() => setText(ex.text)}
                    className="text-left px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors">
                    <p className="font-mono text-xs font-semibold text-gray-700">{ex.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{ex.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {reply && (
              <div className="mt-4 p-3 bg-brand-50 border border-brand-100 rounded-xl">
                <p className="text-[10px] font-semibold text-brand-500 mb-1">FarmLink reply:</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{reply}</p>
              </div>
            )}
          </div>

          <div className="card-p space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Info size={14} className="text-gray-400" /> How the SMS flow works
            </h3>
            {[
              { icon: '📢', title: 'Buyer posts a demand', desc: 'System automatically sends SMS to every farmer who grows that crop' },
              { icon: '📱', title: 'Farmer reads alert', desc: 'Plain SMS on any phone: "Eko Hotels needs 500kg Tomatoes @₦280/kg. Reply ACCEPT FL1"' },
              { icon: '✍️', title: 'Farmer replies', desc: 'Types ACCEPT FL1 (or ACCEPT FL1 200 for partial). Works on 2G, any handset' },
              { icon: '✅', title: 'Commitment created', desc: 'Instantly logged. Buyer sees it on dashboard. Farmer gets confirmation SMS back' },
            ].map(s => (
              <div key={s.title} className="flex gap-3 items-start">
                <span className="text-lg shrink-0">{s.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
