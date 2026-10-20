import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, PlusCircle, CheckSquare,
  Search, ClipboardList, BookOpen,
  Users, FileText, MessageSquare, Star, MessageCircle, Hash, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Logo from './Logo';
import Avatar from './Avatar';
import { prefetchRoute } from '../lib/prefetch';

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

export function getNavLinks(role?: string) {
  return role === 'buyer' ? buyerLinks : role === 'farmer' ? farmerLinks : adminLinks;
}

export function homeFor(role?: string) {
  return role === 'buyer' ? '/buyer' : role === 'farmer' ? '/farmer' : '/admin';
}

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const { user } = useAuth();
  const { count } = useNotifications();
  const links = getNavLinks(user?.role);

  const subtitle =
    user?.role === 'buyer'  ? user?.buyer?.businessName :
    user?.role === 'farmer' ? user?.farmer?.farmLocation :
    'Administrator';

  const mainLinks = user?.role === 'farmer' ? links.slice(0, 6) : links;
  const fieldLinks = user?.role === 'farmer' ? links.slice(6) : [];

  const renderLink = ({ to, label, icon: Icon, end, badge }: LinkDef) => (
    <NavLink key={to} to={to} end={end} onClick={onClose}
      onMouseEnter={() => prefetchRoute(to, user?.id)} onFocus={() => prefetchRoute(to, user?.id)} onTouchStart={() => prefetchRoute(to, user?.id)}>
      {({ isActive }) => (
        <span className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
          isActive ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}>
          <Icon size={17} strokeWidth={1.9} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
          <span className="flex-1">{label}</span>
          {badge && count > 0 && (
            <span className="rounded-md bg-forest-800 px-1.5 text-xs font-medium text-white">{count > 9 ? '9+' : count}</span>
          )}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={onClose} />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 shrink-0 items-center justify-between px-5">
          <Logo to={homeFor(user?.role)} />
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          <div className="space-y-0.5">{mainLinks.map(renderLink)}</div>

          {fieldLinks.length > 0 && (
            <>
              <p className="mb-1.5 mt-6 px-3 text-xs font-medium text-gray-500">Field access</p>
              <div className="space-y-0.5">{fieldLinks.map(renderLink)}</div>
            </>
          )}
        </nav>

        <Link to="/profile" onClick={onClose}
          className="flex items-center gap-3 border-t border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50">
          <Avatar name={user?.name} size={34} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-500">{subtitle || user?.role}</p>
          </div>
        </Link>
      </aside>
    </>
  );
}
