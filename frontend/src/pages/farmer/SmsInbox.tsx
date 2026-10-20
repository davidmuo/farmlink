import { useEffect, useState, FormEvent } from 'react';
import { format } from 'date-fns';
import { MessageSquare, Send, Phone, Megaphone, Smartphone, Reply, CheckCircle2, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
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

const FLOW = [
  { icon: Megaphone,    title: 'Buyer posts a demand', desc: 'System automatically sends SMS to every farmer who grows that crop' },
  { icon: Smartphone,   title: 'Farmer reads alert',   desc: 'Plain SMS on any phone: "Eko Hotels needs 500kg Tomatoes @₦280/kg. Reply ACCEPT FL1"' },
  { icon: Reply,        title: 'Farmer replies',       desc: 'Types ACCEPT FL1 (or ACCEPT FL1 200 for partial). Works on 2G, any handset' },
  { icon: CheckCircle2, title: 'Commitment created',   desc: 'Instantly logged. Buyer sees it on dashboard. Farmer gets confirmation SMS back' },
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
    } catch { setReply('Error: check your connection.'); }
    finally   { setSending(false); }
  };

  return (
    <div>
      <PageHeader
        title="SMS Inbox"
        subtitle="Farmers receive alerts and can reply directly from any phone, with no internet needed."
        action={
          <span className="badge-gray">
            <Phone size={13} className="text-forest-600" /> {user?.phone}
          </span>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <div className="card overflow-hidden lg:col-span-3">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"><MessageCircle size={17} /></span>
            <div>
              <p className="text-sm font-semibold text-gray-900">FarmLink</p>
              <p className="text-xs text-gray-500">Message history</p>
            </div>
          </div>

          <div className="max-h-[620px] min-h-[320px] overflow-y-auto bg-gray-50 px-4 py-5">
            {loading ? <Spinner variant="inline" /> : logs.length === 0 ? (
              <EmptyState bare icon={MessageSquare} title="No messages yet"
                description="When buyers post demands matching your crops, you'll receive an SMS alert here." />
            ) : (
              <div className="space-y-3">
                {[...logs].reverse().map(log => {
                  const isOut = log.direction === 'outbound';
                  return (
                    <div key={log.id} className={`flex items-end gap-2 ${isOut ? '' : 'flex-row-reverse'}`}>
                      {isOut ? <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"><MessageCircle size={13} /></span> : <Avatar name={user?.name} size={26} />}
                      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isOut ? 'rounded-bl-sm border border-gray-200 bg-white' : 'rounded-br-sm bg-forest-800 text-white'}`}>
                        <p className={`whitespace-pre-wrap text-[13px] leading-relaxed ${isOut ? 'text-gray-800' : 'text-white'}`}>
                          {log.message}
                        </p>
                        <div className={`mt-1.5 flex items-center gap-2 ${isOut ? '' : 'justify-end'}`}>
                          {log.demandId && (
                            <span className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${isOut ? 'bg-gray-100 text-gray-700' : 'bg-white/15 text-white'}`}>
                              FL{log.demandId}
                            </span>
                          )}
                          <span className={`text-[10px] ${isOut ? 'text-gray-400' : 'text-white/50'}`}>
                            {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <p className="card-title">Simulate an SMS reply
            </p>
            <p className="mb-4 mt-2 text-xs leading-relaxed text-gray-500">
              Type what you'd SMS from your phone. The backend processes it exactly as a real SMS reply would be handled.
            </p>

            <form onSubmit={simulate} className="flex gap-2">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                className="input h-11 flex-1 font-mono"
                placeholder="e.g. ACCEPT FL1"
                autoComplete="off"
              />
              <button type="submit" disabled={sending || !text.trim()} className="btn-lg btn-accent shrink-0 px-4" aria-label="Send SMS">
                {sending ? '…' : <Send size={15} />}
              </button>
            </form>

            <p className="stat-label mb-2 mt-5">Quick send</p>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLES.map(ex => (
                <button key={ex.text} type="button"
                  onClick={() => setText(ex.text)}
                  className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-left transition-colors hover:border-gray-200 hover:bg-white">
                  <p className="font-mono text-xs font-semibold text-forest-800">{ex.text}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{ex.label}</p>
                </button>
              ))}
            </div>

            {reply && (
              <div className="mt-4 animate-fade-in rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium text-gray-600">FarmLink reply</p>
                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-800">{reply}</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <p className="card-title mb-4">How the SMS flow works</p>
            <ol className="space-y-0">
              {FLOW.map((s, i) => (
                <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < FLOW.length - 1 && <span className="absolute left-[15px] top-9 h-[calc(100%-2.25rem)] w-px bg-gray-200" />}
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <s.icon size={15} />
                  </span>
                  <div className="pt-1">
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
