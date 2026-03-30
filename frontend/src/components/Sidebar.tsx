import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, PlusCircle, CheckSquare,
  Search, ClipboardList, BookOpen,
  Users, FileText, MessageSquare, Star, MessageCircle, Hash,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const GREEN = '#6DFF8A';

type LinkDef = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean; badge?: boolean };

const buyerLinks: LinkDef[] = [
  { to: '/buyer',             label: 'Overview',      icon: LayoutDashboard, end: true },
  { to: '/buyer/demands/new', label: 'Post Demand',   icon: PlusCircle },
  { to: '/buyer/demands',     label: 'My Demands',    icon: ShoppingBag, end: true },
  { to: '/buyer/commitments', label: 'Farmer Offers', icon: CheckSquare, badge: true },
  { to: '/buyer/messages',    label: 'Messages',      icon: MessageSquare },
  { to: '/buyer/reviews',     label: 'Reviews',       icon: Star },
];
const farmerLinks: LinkDef[] = [
  { to: '/farmer',             label: 'Overview',       icon: LayoutDashboard, end: true },
  { to: '/farmer/demands',     label: 'Browse Demands', icon: Search },
  { to: '/farmer/commitments', label: 'My Commitments', icon: ClipboardList },
  { to: '/farmer/records',     label: 'Farm Records',   icon: BookOpen },
  { to: '/farmer/messages',    label: 'Messages',       icon: MessageSquare },
  { to: '/farmer/reviews',     label: 'Reviews',        icon: Star },
  { to: '/farmer/sms',         label: 'SMS Inbox',      icon: MessageCircle },
  { to: '/farmer/ussd',        label: 'USSD',           icon: Hash },
];
const adminLinks: LinkDef[] = [
  { to: '/admin',       label: 'Overview',   icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users',      icon: Users },
  { to: '/admin/audit', label: 'Audit Logs', icon: FileText },
];

export default function Sidebar() {
  const { user } = useAuth();
  const { count } = useNotifications();
  const links = user?.role === 'buyer' ? buyerLinks : user?.role === 'farmer' ? farmerLinks : adminLinks;

  return (
    <aside className="fixed inset-y-0 left-0 w-[220px] bg-white flex flex-col z-40 border-r border-gray-100">

      <div className="h-14 flex items-center px-5 shrink-0 border-b border-gray-100">
        <span style={{ fontFamily: "'Syne', sans-serif" }}
          className="font-bold text-gray-900 tracking-tight text-base">FarmLink</span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-3">Menu</p>
        {links.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end}>
            {({ isActive }) => (
              <span className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                isActive ? 'text-gray-900 bg-gray-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
              }`}>
                {isActive && (
                  <span className="absolute left-0 w-0.5 h-5 rounded-r-full" style={{ background: GREEN }} />
                )}
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2}
                  style={isActive ? { color: '#111827' } : {}} />
                <span className="flex-1">{label}</span>
                {badge && count > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-gray-900"
                    style={{ background: GREEN }}>
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest capitalize">
          {user?.role}
        </p>
      </div>
    </aside>
  );
}
