import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Logo from './Logo';

interface Props {
  title: string;
  updated: string;
  children: ReactNode;
  prev: { to: string; label: string };
  next: { to: string; label: string };
}

export default function LegalLayout({ title, updated, children, prev, next }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-md btn-ghost hidden sm:inline-flex">Sign in</Link>
            <Link to="/register" className="btn-md btn-primary">Create account</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {updated}</p>

        <div className="mt-10 space-y-8 text-[15px] leading-relaxed text-gray-700">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <Link to={prev.to} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft size={14} /> {prev.label}
          </Link>
          <Link to={next.to} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            {next.label} <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
