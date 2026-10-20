// Loading placeholder shaped like the content it stands in for.
// `page` mirrors a full screen (heading, stat tiles, list); `inline` is a list inside a section.
export default function Spinner({ className = '', variant = 'page' }: { className?: string; variant?: 'page' | 'inline' }) {
  const rows = (n: number) => (
    <div className="card divide-y divide-gray-100 overflow-hidden">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="skeleton h-11 w-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3.5 w-2/5" />
            <div className="skeleton h-3 w-3/5" />
          </div>
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );

  return (
    <div className={`animate-fade-in ${className}`} role="status" aria-label="Loading">
      {variant === 'page' && (
        <>
          <div className="mb-8 space-y-3">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-8 w-72 max-w-full" />
            <div className="skeleton h-3.5 w-56 max-w-full" />
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[124px] rounded-3xl" />)}
          </div>
        </>
      )}
      {rows(variant === 'page' ? 5 : 3)}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
