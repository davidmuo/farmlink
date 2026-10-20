import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  back?: boolean;
  eyebrow?: ReactNode;
}

export default function PageHeader({ title, subtitle, action, back, eyebrow }: Props) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      <div className="min-w-0">
        {back && (
          <button onClick={() => navigate(-1)}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900">
            <ArrowLeft size={13} /> Back
          </button>
        )}
        {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
