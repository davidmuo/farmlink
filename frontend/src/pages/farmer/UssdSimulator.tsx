import { useState, useRef, useEffect } from 'react';
import { Phone, PhoneOff, Delete, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">USSD Simulator</h1>
          <p className="page-subtitle mt-1">
            Farmers without smartphones can browse and commit to demands by dialling&nbsp;
            <span className="font-semibold text-gray-700">{SERVICE_CODE}</span> — just like mobile banking.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-100 shrink-0">
          <Smartphone size={12} /> Demo mode
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <div className="flex justify-center">
          <div className="w-[280px]">
            <div className="bg-gray-900 rounded-[2.5rem] p-4"
              style={{ boxShadow: '0 25px 60px -10px rgb(0 0 0 / 0.5), 0 0 0 1px rgb(255 255 255 / 0.08)' }}>

              <div className="flex justify-center mb-3">
                <div className="w-16 h-1.5 bg-gray-700 rounded-full" />
              </div>

              <div className="bg-gray-950 rounded-2xl overflow-hidden mb-3 border border-gray-800">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/80">
                  <span className="text-[9px] text-gray-500 font-medium">MTN Nigeria</span>
                  <span className="text-[9px] text-gray-500">
                    {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div ref={screenRef} className="min-h-[180px] max-h-[200px] overflow-y-auto p-3"
                  style={{ background: '#0d1117' }}>
                  {phase === 'idle' && (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">📱</div>
                      <p className="text-gray-500 text-xs">Enter USSD code to dial</p>
                    </div>
                  )}
                  {loading && (
                    <div className="text-center py-10">
                      <div className="inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-green-400 text-xs mt-3 font-mono">Connecting...</p>
                    </div>
                  )}
                  {(phase === 'active' || phase === 'ended') && !loading && (
                    <pre className="text-green-400 text-[11px] leading-5 whitespace-pre-wrap font-mono">{screen}</pre>
                  )}
                </div>

                <div className="px-3 py-2 bg-gray-900 border-t border-gray-800 min-h-[32px] flex items-center">
                  {phase === 'idle' ? (
                    <span className="font-mono text-green-400 text-sm tracking-widest">
                      {dial}<span className="animate-pulse">_</span>
                    </span>
                  ) : phase === 'active' ? (
                    <span className="font-mono text-white text-sm">
                      {pending || <span className="text-gray-600 text-xs">type number…</span>}
                      <span className="text-green-400 animate-pulse">|</span>
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={handleCall} disabled={!isCallable || loading}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  style={{ background: isCallable ? '#16A34A' : '#1a2e1a', color: '#fff' }}>
                  <Phone size={14} /> Call
                </button>
                <button onClick={handleHangUp} disabled={phase === 'idle'}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                  style={{ background: phase !== 'idle' ? '#DC2626' : '#2e1a1a', color: '#fff' }}>
                  <PhoneOff size={14} /> End
                </button>
              </div>

              <div className="space-y-2">
                {KEYS.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-3 gap-2">
                    {row.map(k => (
                      <button key={k} onClick={() => handleKey(k)}
                        className="h-11 rounded-xl font-mono font-bold text-sm text-white transition-all active:scale-95"
                        style={{ background: '#1e2939' }}>
                        {k}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={handleDelete}
                    className="h-11 rounded-xl text-gray-400 flex items-center justify-center active:scale-95"
                    style={{ background: '#1e2939' }}>
                    <Delete size={16} />
                  </button>
                  <button onClick={handleSend}
                    disabled={phase !== 'active' || !pending || loading}
                    className="h-11 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-30"
                    style={{ background: phase === 'active' && pending ? '#16A34A' : '#1a2e1a', color: '#fff' }}>
                    SEND
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-3">
                <div className="w-10 h-1.5 bg-gray-700 rounded-full" />
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3 font-mono">{phoneNumber}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-p">
            <h3 className="font-semibold text-gray-900 mb-3">How to use</h3>
            <div className="space-y-3">
              {[
                { step: '1', title: 'Press Call', desc: `Dials ${SERVICE_CODE} and opens FarmLink menu` },
                { step: '2', title: 'Press 1', desc: 'Shows demands matching your crops' },
                { step: '3', title: 'Select a demand', desc: 'Press the number next to any demand to view details' },
                { step: '4', title: 'Press 1 to commit', desc: 'Full quantity, or press 2 to enter custom kg' },
                { step: '5', title: 'Confirm', desc: 'Press 1 to confirm — commitment is created instantly' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{s.step}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-p">
            <h3 className="font-semibold text-gray-900 mb-3">Quick reference</h3>
            <div className="space-y-1.5">
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
                <div key={r.code} className="flex items-center gap-3 py-0.5">
                  <code className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md min-w-[80px] text-center">{r.code}</code>
                  <span className="text-xs text-gray-500">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-800 mb-1">Production note</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Using phone <span className="font-medium">{phoneNumber}</span>. In production, any farmer dials from their registered number — no smartphone or internet needed. Gateway: Africa's Talking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
