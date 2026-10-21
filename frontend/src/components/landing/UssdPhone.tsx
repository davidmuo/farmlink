import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/net';

const DIAL = '*384*1#';
const deliverBy = new Date(Date.now() + 10 * 86_400_000)
  .toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

// The screens the USSD service sends back (backend/src/routes/ussd.ts) for the seeded farmer
const SCREENS: { text: string; reply?: string }[] = [
  { text: 'Welcome to FarmLink\nEmeka Okafor\nIfo, Ogun State\n\n1. Matching Demands\n2. My Commitments\n3. My Profile\n0. Exit', reply: '1' },
  { text: 'MATCHING DEMANDS (4)\n1. Tomatoes 180kg @N280/kg\n2. Peppers 200kg @N600/kg\n3. Tomatoes 500kg @N260/kg\n4. Maize 2000kg @N280/kg\n0. Back', reply: '1' },
  { text: `Tomatoes\nBuyer: Eko Hotels & Suites\nPrice: N280/kg\nAvailable: 180kg\nQuality: Grade A\nDeliver by: ${deliverBy}\n\n1. Commit full 180kg\n2. Commit custom amount\n0. Back`, reply: '1' },
  { text: 'Confirm full commitment:\nTomatoes 180kg\nBuyer: Eko Hotels & Suites\nValue: N50,400\n\n1. Confirm & Submit\n0. Cancel', reply: '1' },
  { text: 'Commitment submitted!\nTomatoes 180kg\nBuyer: Eko Hotels & Suites\nValue: N50,400\n\nBuyer will be notified.\nFarmLink - Connecting Farmers' },
];

const KEYS: [key: string, letters: string][] = [
  ['1', ''], ['2', 'abc'], ['3', 'def'], ['4', 'ghi'], ['5', 'jkl'], ['6', 'mno'],
  ['7', 'pqrs'], ['8', 'tuv'], ['9', 'wxyz'], ['*', ''], ['0', '+'], ['#', ''],
];

const DIALLING = -1;
const RUNNING = -2;

export default function UssdPhone() {
  const ref = useRef<HTMLDivElement>(null);
  const [screen, setScreen] = useState(0);
  const [input, setInput] = useState('');
  const [pressed, setPressed] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  // Play only while the phone is on screen and the tab is visible
  useEffect(() => {
    if (prefersReducedMotion() || !ref.current) return;
    let inView = false;
    const update = () => setActive(inView && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); }, { threshold: 0.35 });
    io.observe(ref.current);
    document.addEventListener('visibilitychange', update);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!active) return;
    // Clearing the timers on cleanup leaves the pending wait unresolved, which ends the script
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>(res => { timers.push(window.setTimeout(res, ms)); });
    const press = async (key: string, ms = 170) => { setPressed(key); await wait(ms); setPressed(null); };

    (async () => {
      for (;;) {
        setScreen(DIALLING); setInput('');
        await wait(800);
        for (const ch of DIAL) { await press(ch); setInput(s => s + ch); await wait(110); }
        await press('call', 260);
        setScreen(RUNNING);
        await wait(1100);

        for (let i = 0; i < SCREENS.length; i++) {
          const { reply } = SCREENS[i];
          setScreen(i); setInput('');
          await wait(reply ? 2000 : 3800);
          if (reply) {
            await press(reply);
            setInput(reply);
            await wait(450);
            await press('send', 220);
          }
        }
      }
    })();

    return () => timers.forEach(clearTimeout);
  }, [active]);

  const current = screen >= 0 ? SCREENS[screen] : null;
  const keyClass = (k: string) =>
    `transition-colors duration-100 ${pressed === k ? 'bg-lime-400 text-forest-950' : 'bg-white/[0.07] text-white'}`;

  return (
    <div ref={ref} role="img" aria-label="A farmer dials *384*1#, opens matching demands and commits 180 kg of tomatoes to Eko Hotels & Suites"
      className="w-[256px] rounded-[36px] bg-[#0E1310] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
      <div aria-hidden="true">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/15" />

        {/* Screen */}
        <div className="flex h-[252px] flex-col rounded-lg bg-[#C9D5B9] px-2.5 pb-1.5 pt-1.5 font-mono text-[10.5px] leading-[15px] text-[#1C2616] shadow-[inset_0_2px_8px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between text-[9px] opacity-70">
            <span className="flex items-end gap-px">
              {[3, 5, 7, 9].map(h => <span key={h} className="w-[2px] bg-current" style={{ height: h }} />)}
            </span>
            <span>09:41</span>
            <span className="h-[7px] w-[14px] rounded-[1px] border border-current p-px"><span className="block h-full w-2/3 bg-current" /></span>
          </div>

          <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
            {screen === DIALLING && (
              <div className="flex h-full flex-col justify-end pb-3">
                <p className="text-[10px] opacity-70">Dial</p>
                <p className="mt-1 text-[22px] leading-7 tracking-wide">
                  {input}<span className="animate-caret">_</span>
                </p>
              </div>
            )}
            {screen === RUNNING && (
              <div className="flex h-full items-center justify-center text-center">
                <p>USSD code running<span className="animate-caret">...</span></p>
              </div>
            )}
            {current && <pre className="whitespace-pre-wrap font-mono">{current.text}</pre>}
          </div>

          {current?.reply && (
            <p className="border-t border-[#1C2616]/25 pt-1">Reply: {input}<span className="animate-caret">_</span></p>
          )}
          <div className="mt-0.5 flex justify-between text-[9.5px] font-semibold uppercase">
            <span>{screen === DIALLING ? 'Call' : current?.reply ? 'Send' : current ? 'OK' : ''}</span>
            <span>{screen === DIALLING ? 'Clear' : current?.reply ? 'Cancel' : ''}</span>
          </div>
        </div>

        {/* Soft keys and call keys */}
        <div className="mt-4 grid grid-cols-3 items-center gap-2">
          <span className={`h-7 rounded-lg ${keyClass('send')}`} />
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10">
            <span className="h-4 w-4 rounded-full bg-white/10" />
          </span>
          <span className="h-7 rounded-lg bg-white/[0.07]" />
          <span className={`flex h-7 items-center justify-center rounded-lg ${pressed === 'call' ? 'bg-lime-400 text-forest-950' : 'bg-white/[0.07] text-lime-400'}`}>
            <Phone size={13} />
          </span>
          <span />
          <span className="flex h-7 items-center justify-center rounded-lg bg-white/[0.07] text-red-400"><PhoneOff size={13} /></span>
        </div>

        {/* Number pad */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {KEYS.map(([k, letters]) => (
            <span key={k} className={`flex h-9 flex-col items-center justify-center rounded-lg ${keyClass(k)}`}>
              <span className="text-sm font-medium leading-none">{k}</span>
              {letters && <span className="mt-0.5 text-[7.5px] uppercase leading-none tracking-wider opacity-50">{letters}</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
