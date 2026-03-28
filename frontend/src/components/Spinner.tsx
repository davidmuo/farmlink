export default function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-24 ${className}`}>
      <div className="w-7 h-7 border-2 border-gray-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
