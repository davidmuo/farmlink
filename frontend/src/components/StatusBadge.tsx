interface Props { status: string; size?: 'sm' | 'md'; }

const cfg: Record<string, { cls: string; dot: string; label: string }> = {
  open:             { cls: 'badge-green',  dot: 'bg-emerald-500', label: 'Open' },
  partially_filled: { cls: 'badge-amber',  dot: 'bg-amber-500',   label: 'Partial' },
  closed:           { cls: 'badge-gray',   dot: 'bg-gray-400',    label: 'Closed' },
  pending:          { cls: 'badge-blue',   dot: 'bg-blue-500',    label: 'Pending' },
  accepted:         { cls: 'badge-green',  dot: 'bg-emerald-500', label: 'Accepted' },
  rejected:         { cls: 'badge-red',    dot: 'bg-red-500',     label: 'Rejected' },
  cancelled:        { cls: 'badge-gray',   dot: 'bg-gray-400',    label: 'Cancelled' },
  full:             { cls: 'badge-purple', dot: 'bg-purple-500',  label: 'Full' },
  partial:          { cls: 'badge-amber',  dot: 'bg-amber-500',   label: 'Partial' },
};

export default function StatusBadge({ status }: Props) {
  const c = cfg[status] || { cls: 'badge-gray', dot: 'bg-gray-400', label: status };
  return (
    <span className={c.cls}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} inline-block shrink-0`} />
      {c.label}
    </span>
  );
}
