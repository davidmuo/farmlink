import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  bare?: boolean;
}

export default function EmptyState({ icon: Icon, title, description, action, bare = false }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${bare ? '' : 'card'}`}>
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <p className="font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
