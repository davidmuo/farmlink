import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Users, Search, MapPin, Building2, Layers } from 'lucide-react';
import { User } from '../../types';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
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

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input h-10 pl-10" placeholder="Search by name or email…" />
        </div>
        <div className="tabs">
          {(['all', 'farmer', 'buyer', 'admin'] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`tab ${roleFilter === r ? 'tab-active' : ''}`}>
              {r.charAt(0).toUpperCase() + r.slice(1)} <span className="tab-count">{counts[r]}</span>
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
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size={38} />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`capitalize ${roleBadge[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                  <td className="text-xs text-gray-600">
                    {u.buyer && (
                      <span className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-gray-400" /> {u.buyer.businessName} · {u.buyer.businessType}
                      </span>
                    )}
                    {u.farmer && (
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /> {u.farmer.farmLocation}</span>
                        <span className="flex items-center gap-1.5"><Layers size={12} className="text-gray-400" /> {u.farmer.farmSize} acres</span>
                      </div>
                    )}
                    {!u.buyer && !u.farmer && <span className="text-gray-400">None</span>}
                  </td>
                  <td className="tabular whitespace-nowrap text-gray-500">{u.phone || 'Not set'}</td>
                  <td className="whitespace-nowrap text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
