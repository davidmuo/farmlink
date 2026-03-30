import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Users, Search, MapPin, Building2, Layers } from 'lucide-react';
import { User } from '../../types';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import api from '../../lib/api';

const roleBadge: Record<string, string> = {
  buyer: 'badge-blue', farmer: 'badge-green', admin: 'badge-purple',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const counts = {
    all: users.length,
    farmer: users.filter(u => u.role === 'farmer').length,
    buyer: users.filter(u => u.role === 'buyer').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchSearch = search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Users" subtitle={`${users.length} registered users on the platform`} />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search by name or email..." />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'farmer', 'buyer', 'admin'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                roleFilter === r ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              {r.charAt(0).toUpperCase() + r.slice(1)} <span className="opacity-60">({counts[r]})</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try different search or filter." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Details</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600 text-xs flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={roleBadge[u.role] || 'badge-gray'}>{u.role}</span></td>
                  <td className="text-gray-500 text-xs">
                    {u.buyer && (
                      <span className="flex items-center gap-1">
                        <Building2 size={11} /> {u.buyer.businessName} · {u.buyer.businessType}
                      </span>
                    )}
                    {u.farmer && (
                      <div>
                        <span className="flex items-center gap-1"><MapPin size={11} /> {u.farmer.farmLocation}</span>
                        <span className="flex items-center gap-1 mt-0.5"><Layers size={11} /> {u.farmer.farmSize} acres</span>
                      </div>
                    )}
                    {!u.buyer && !u.farmer && <span className="text-gray-300">—</span>}
                  </td>
                  <td className="text-gray-400">{u.phone || '—'}</td>
                  <td className="text-gray-400">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
