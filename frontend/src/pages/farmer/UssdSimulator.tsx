import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Delete, Smartphone, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';

type Phase = 'idle' | 'active' | 'ended';

const SERVICE_CODE = '*384*1#';
const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

export default function UssdSimulator() {
  const { user } = useAuth();
  const [phase, setPhase]     = useState<Phase>('idle');
  const [dial, setDial]       = useState(SERVICE_CODE);
  const [path, setPath]       = useState('');
  const [pending, setPending] = useState('');
  const [screen, setScreen]   = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId             = useRef(Math.random().toString(36).slice(2));
  const screenRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (screenRef.current) screenRef.current.scrollTop = screenRef.current.scrollHeight;
  }, [screen]);

  const phoneNumber = user?.phone || '+2348030002001';

  async function ussdRequest(text: string) {
    setLoading(true);
    try {
      const res = await api.post(
        '/ussd',
        { sessionId: sessionId.current, serviceCode: SERVICE_CODE, phoneNumber, text },
        { responseType: 'text', transformResponse: [(d) => d] }
      );
      const raw: string = typeof res.data === 'string' ? res.data : String(res.data);
      const isEnd = raw.startsWith('END');
      setScreen(raw.replace(/^(CON|END)\s*/, ''));
      setPhase(isEnd ? 'ended' : 'active');
    } catch {
      setScreen('Service temporarily unavailable.\nPlease try again.');
      setPhase('ended');
    } finally { setLoading(false); }
  }

  function handleCall() {
    setPhase('active');
    setPath('');
    setPending('');
    sessionId.current = Math.random().toString(36).slice(2);
    ussdRequest('');
  }

  function handleHangUp() {
    setPhase('idle');
    setDial(SERVICE_CODE);
    setPath('');
    setPending('');
    setScreen('');
  }

  function handleKey(k: string) {
    if (phase === 'idle') { setDial(p => p + k); return; }
    if (phase === 'active') setPending(p => p + k);
  }

  function handleSend() {
    if (phase !== 'active' || !pending) return;
    const newPath = path === '' ? pending : `${path}*${pending}`;
    setPath(newPath);
    setPending('');
    ussdRequest(newPath);
  }

  function handleDelete() {
    if (phase === 'idle') { setDial(p => p.slice(0, -1)); return; }
    if (phase === 'active') setPending(p => p.slice(0, -1));
  }

  const isCallable = phase === 'idle';

  return (
    <div>
      <PageHeader
        title="USSD Simulator"
        subtitle={<>Farmers without smartphones can browse and commit to demands by dialling <span className="font-mono font-semibold text-gray-800">{SERVICE_CODE}</span>, just like mobile banking.</>}
        action={
          <span className="badge-gray">
            <Smartphone size={13} /> Demo mode
          </span>
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="flex justify-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-8 sm:px-6">

          <div className="w-full max-w-[288px]">
            <div className="rounded-[36px] bg-[#16181a] p-4 shadow-lg">
              <div className="mb-3 flex justify-center">
                <div className="h-1.5 w-16 rounded-full bg-white/10" />
              </div>

              <div className="mb-4 overflow-hidden rounded-2xl bg-[#0B110C] ring-1 ring-white/5">
                <div className="flex items-center justify-between bg-white/5 px-3 py-1.5">
                  <span className="text-[10px] font-medium text-white/40">MTN Nigeria</span>
                  <span className="text-[10px] text-white/40">
                    {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div ref={screenRef} className="max-h-[210px] min-h-[190px] overflow-y-auto p-4">
                  {phase === 'idle' && (
                    <div className="flex h-[160px] flex-col items-center justify-center text-center">
                      <Smartphone size={26} className="mb-3 text-white/40" />
                      <p className="text-xs text-white/40">Enter USSD code and press Call</p>
                    </div>
                  )}
                  {loading && (
                    <div className="flex h-[160px] flex-col items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                      <p className="mt-3 font-mono text-xs text-white/70">Connecting...</p>
                    </div>
                  )}
                  {(phase === 'active' || phase === 'ended') && !loading && (
                    <pre className="whitespace-pre-wrap font-mono text-[12px] leading-6 text-gray-100">{screen}</pre>
                  )}
                </div>

                <div className="flex min-h-[38px] items-center border-t border-white/5 px-4 py-2">
                  {phase === 'idle' ? (
                    <span className="font-mono text-sm tracking-widest text-gray-100">
                      {dial}<span className="text-white/60">_</span>
                    </span>
                  ) : phase === 'active' ? (
                    <span className="font-mono text-sm text-white">
                      {pending || <span className="text-xs text-white/30">type number…</span>}
                      <span className="text-white/60">|</span>
                    </span>
                  ) : <span className="text-xs text-white/30">Session ended</span>}
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <button onClick={handleCall} disabled={!isCallable || loading}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-3 text-xs font-semibold text-white disabled:opacity-25">
                  <Phone size={14} /> Call
                </button>
                <button onClick={handleHangUp} disabled={phase === 'idle'}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-xs font-semibold text-white disabled:opacity-25">
                  <PhoneOff size={14} /> End
                </button>
              </div>

              <div className="space-y-2">
                {KEYS.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-3 gap-2">
                    {row.map(k => (
                      <button key={k} onClick={() => handleKey(k)}
                        className="h-12 rounded-xl bg-white/[0.08] font-mono text-base font-medium text-white hover:bg-white/[0.14]">
                        {k}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <button onClick={handleDelete} aria-label="Delete"
                    className="flex h-12 items-center justify-center rounded-xl bg-white/[0.08] text-white/70 hover:bg-white/[0.14]">
                    <Delete size={17} />
                  </button>
                  <button onClick={handleSend}
                    disabled={phase !== 'active' || !pending || loading}
                    className="h-12 rounded-xl bg-white/[0.14] text-xs font-semibold text-white disabled:opacity-25">
                    SEND
                  </button>
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <div className="h-1.5 w-12 rounded-full bg-white/10" />
              </div>
            </div>
            <p className="mt-4 text-center font-mono text-xs text-white/50">{phoneNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <p className="card-title mb-5">How to use</p>
            <ol className="space-y-4">
              {[
                { step: '1', title: 'Press Call', desc: `Dials ${SERVICE_CODE} and opens FarmLink menu` },
                { step: '2', title: 'Press 1', desc: 'Shows demands matching your crops' },
                { step: '3', title: 'Select a demand', desc: 'Press the number next to any demand to view details' },
                { step: '4', title: 'Press 1 to commit', desc: 'Full quantity, or press 2 to enter custom kg' },
                { step: '5', title: 'Confirm', desc: 'Press 1 to confirm. The commitment is created instantly' },
              ].map(s => (
                <li key={s.step} className="flex gap-3.5">
                  <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-700">{s.step}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-6">
            <p className="card-title mb-4">Quick reference</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                { code: SERVICE_CODE, desc: 'Open FarmLink' },
                { code: '1',          desc: 'Matching demands' },
                { code: '1 → 2',      desc: 'View second demand' },
                { code: '→ 1',        desc: 'Commit full quantity' },
                { code: '→ 2',        desc: 'Commit custom amount' },
                { code: '2',          desc: 'My commitments' },
                { code: '3',          desc: 'My profile' },
                { code: '0',          desc: 'Back / exit' },
              ].map(r => (
                <div key={r.code} className="flex items-center gap-3 rounded-xl px-1 py-1">
                  <code className="min-w-[76px] rounded-lg bg-gray-100 px-2 py-1 text-center font-mono text-xs font-semibold text-forest-800">{r.code}</code>
                  <span className="text-xs text-gray-600">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-3xl bg-amber-50 p-5 ring-1 ring-amber-100">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="mb-1 text-xs font-semibold text-amber-900">Production note</p>
              <p className="text-xs leading-relaxed text-amber-800">
                Using phone <span className="font-medium">{phoneNumber}</span>. In production, any farmer dials from their registered number. No smartphone or internet needed. Gateway: Africa's Talking.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
