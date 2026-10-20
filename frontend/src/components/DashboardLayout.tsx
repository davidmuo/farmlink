import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, Bell, X, Sparkles, Send, Loader2, Menu, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Sidebar, { getNavLinks } from './Sidebar';
import Avatar from './Avatar';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../lib/api';
import { prefetchRolePages } from '../lib/prefetch';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

const AI_SUGGESTIONS = [
  'Why are my tomato leaves curling?',
  'Best time to plant maize in Ogun?',
  'How do I store yams longer?',
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { count, refresh, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [navOpen, setNavOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; text: string; imagePreview?: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  // Once signed in, quietly download the code for the rest of this role's pages
  useEffect(() => { prefetchRolePages(user?.role); }, [user?.role]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelOpen(false);
    };
    if (panelOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [panelOpen]);

  const openPanel = () => {
    setPanelOpen(true);
    api.get('/notifications').then(r => setNotifications(r.data.notifications ?? r.data)).catch(() => {});
  };

  const handleNotificationClick = async (n: Notification) => {
    try { await api.post(`/notifications/${n.id}/read`); } catch {}
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    refresh();
    setPanelOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (aiPanelRef.current && !aiPanelRef.current.contains(e.target as Node)) setAiOpen(false);
    };
    if (aiOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [aiOpen]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, aiLoading]);

  const sendAiMessage = async () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user' as const, text: aiInput.trim() };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);
    try {
      const r = await api.post('/ai/chat', { message: userMsg.text });
      setAiMessages(prev => [...prev, { role: 'assistant', text: r.data.reply }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, the assistant is unavailable right now. Please try again.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Label for the breadcrumb: the nav link that best matches the current path
  const section = pathname === '/profile'
    ? 'Profile & Settings'
    : [...getNavLinks(user?.role)]
        .filter(l => pathname === l.to || pathname.startsWith(l.to + '/'))
        .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? 'Overview';

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <main className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 sm:px-8">
          <button onClick={() => setNavOpen(true)} className="-ml-1 rounded-xl p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Open menu">
            <Menu size={20} />
          </button>
          <span className="lg:hidden"><Logo to={null} /></span>

          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <span className="capitalize text-gray-400">{user?.role}</span>
            <span className="text-gray-300">/</span>
            <span className="truncate font-medium text-gray-900">{section}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {user?.role === 'farmer' && (
              <button
                onClick={() => setAiOpen(o => !o)}
                className="btn-sm btn-secondary"
                title="AI Farming Assistant"
              >
                <Sparkles size={14} className="text-gray-500" />
                <span className="hidden sm:inline">Assistant</span>
              </button>
            )}

            <button
              onClick={openPanel}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-white hover:shadow-card"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest-800 px-1 text-[10px] font-medium text-white ring-2 ring-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            <div ref={ref} className="relative ml-1">
              <button onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 transition-colors hover:bg-white hover:shadow-card">
                <Avatar name={user?.name} size={32} />
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 animate-slide-down overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                    <Avatar name={user?.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="truncate text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button onClick={() => { navigate('/profile'); setOpen(false); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50">
                      <Settings size={15} className="text-gray-400" /> Profile &amp; settings
                    </button>
                    <button onClick={() => { logout(); navigate('/login'); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50">
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </main>

      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 animate-fade-in bg-black/30" />
          <div
            ref={panelRef}
            className="relative flex h-full w-full max-w-sm animate-slide-in-right flex-col bg-white shadow-xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
              <div>
                <p className="text-[15px] font-semibold text-gray-900">Notifications</p>
                {unread > 0 && <p className="text-xs text-gray-500">{unread} unread</p>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close notifications"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Bell size={20} /></span>
                  <p className="font-semibold text-gray-900">You're all caught up</p>
                  <p className="text-sm text-gray-500">New offers, acceptances and deliveries will show up here.</p>
                </div>
              ) : (
                <div className="p-2">
                  {notifications.map(n => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex w-full gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-gray-50 ${!n.read ? 'bg-gray-50' : ''}`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${!n.read ? 'bg-forest-50 text-forest-700' : 'bg-gray-100 text-gray-400'}`}>
                        <Bell size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`truncate text-sm ${!n.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.title}</p>
                          {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-forest-600" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{n.body}</p>
                        <p className="mt-1.5 text-[11px] text-gray-400">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 animate-fade-in bg-black/30" />
          <div
            ref={aiPanelRef}
            className="relative flex h-full w-full max-w-md animate-slide-in-right flex-col bg-white shadow-xl"
          >
            <div className="shrink-0 border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-gray-900">Farming assistant</p>
                  <p className="text-xs text-gray-500">Crops, pests, diseases and soil health</p>
                </div>
                <button
                  onClick={() => setAiOpen(false)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-4 py-5">
              {aiMessages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                  <p className="font-semibold text-gray-900">Ask me anything</p>
                  <p className="mt-1 text-sm text-gray-500">Get practical advice for your farm.</p>
                  <div className="mt-6 flex w-full flex-col gap-2">
                    {AI_SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => setAiInput(s)}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 transition-colors hover:border-gray-300">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex items-end gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Sparkles size={13} /></span>
                  )}
                  <div
                    className={`max-w-[82%] whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-forest-800 text-white'
                        : 'rounded-bl-md bg-white text-gray-700 shadow-card'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex items-end gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500"><Sparkles size={13} /></span>
                  <div className="flex items-center gap-2 rounded-xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5">
                    <Loader2 size={13} className="animate-spin text-gray-400" />
                    <span className="text-[13px] text-gray-500">Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={aiMessagesEndRef} />
            </div>

            <div className="flex items-end gap-2 border-t border-gray-100 bg-white p-3">
              <textarea
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                placeholder="Ask about crops, pests, diseases…"
                rows={1}
                className="input flex-1 resize-none"
                style={{ maxHeight: 96 }}
              />
              <button
                onClick={sendAiMessage}
                disabled={aiLoading || !aiInput.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-forest-800 text-white transition-colors hover:bg-forest-700 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
