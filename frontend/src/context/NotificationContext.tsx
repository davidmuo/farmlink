import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

interface NotificationContextType { count: number; refresh: () => void; markAllRead: () => Promise<void>; }

const NotificationContext = createContext<NotificationContextType>({ count: 0, refresh: () => {}, markAllRead: async () => {} });

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = () => {
    if (!user) { setCount(0); return; }
    api.get('/notifications/count').then(r => setCount(r.data.count)).catch(() => {});
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setCount(0);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  return <NotificationContext.Provider value={{ count, refresh, markAllRead }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() { return useContext(NotificationContext); }
