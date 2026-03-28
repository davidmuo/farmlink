import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface Props {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  back?: boolean;
}

export default function PageHeader({ title, subtitle, action, back }: Props) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <div>
        {back && (
          <button onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-400
            hover:text-gray-700 mb-2 transition-colors">
            <ChevronLeft size={13} /> Back
          </button>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
