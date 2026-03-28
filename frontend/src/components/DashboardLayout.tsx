import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronDown, Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../lib/api';

const GREEN = '#6DFF8A';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { count, refresh, markAllRead } = useNotifications();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close notification panel on outside click
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

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar />
      <main className="flex-1 ml-[220px] min-h-screen">

        {/* Topbar */}
        <div className="h-14 flex items-center justify-end px-6 gap-2 border-b border-gray-100 bg-white sticky top-0 z-30">

          {/* Bell */}
          <button
            onClick={openPanel}
            className="relative p-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Bell size={16} className="text-gray-500" />
            {count > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                style={{ background: GREEN }}
              />
            )}
          </button>

          {/* Profile dropdown */}
          <div ref={ref} className="relative">
            <button onClick={() => setOpen(o => !o)}
              className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center font-bold text-white text-xs shrink-0"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                {user?.name?.charAt(0)}
              </div>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: '0 8px 32px 0 rgb(0 0 0 / 0.10)' }}>
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button onClick={() => { navigate('/profile'); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left">
                    <Settings size={13} className="text-gray-400" /> Settings
                  </button>
                  <button onClick={() => { logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                    <LogOut size={13} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-7 py-8">
          {children}
        </div>
      </main>

      {/* Notification panel overlay */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" />
          <div
            ref={panelRef}
            className="relative w-80 bg-white h-full shadow-xl flex flex-col"
          >
            {/* Panel header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                Notifications
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
                  <Bell size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex gap-3 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.read ? 'border-l-2' : ''}`}
                    style={!n.read ? { borderLeftColor: GREEN } : {}}
                  >
                    {!n.read && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GREEN }} />
                    )}
                    {n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-transparent" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-300 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
