import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Activity, Search } from 'lucide-react';
import { AuditLog } from '../../types';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';
import api from '../../lib/api';

const actionColors: Record<string, string> = {
  CREATE_DEMAND: 'badge-blue',
  CREATE_COMMITMENT: 'badge-green',
  UPDATE_COMMITMENT: 'badge-amber',
  CREATE_FARM_RECORD: 'badge-purple',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/audit-logs').then(r => setLogs(r.data)).finally(() => setLoading(false));
  }, []);

  const actions = ['all', ...Array.from(new Set(logs.map(l => l.action)))];

  const filtered = logs.filter(l => {
    const matchAction = actionFilter === 'all' || l.action === actionFilter;
    const matchSearch = search === '' ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.user?.name.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchSearch;
  });

  if (loading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${logs.length} total actions recorded`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input h-10 pl-10" placeholder="Search logs…" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="input h-10 sm:w-56">
          {actions.map(a => <option key={a} value={a}>{a === 'all' ? 'All actions' : a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <p className="mb-3 text-xs font-medium text-gray-500">{filtered.length} log{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <EmptyState icon={Activity} title="No logs found" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Details</th>
                <th>User</th>
                <th>Role</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className={`whitespace-nowrap capitalize ${actionColors[log.action] || 'badge-gray'}`}>
                      {log.action.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  </td>
                  <td className="max-w-xs text-gray-700">
                    <p className="truncate">{log.details}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5 whitespace-nowrap">
                      <Avatar name={log.user?.name} size={28} />
                      <span className="font-medium text-gray-900">{log.user?.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-gray capitalize">{log.user?.role}</span>
                  </td>
                  <td className="whitespace-nowrap text-gray-500">
                    {format(new Date(log.timestamp), 'MMM d, yyyy · HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
