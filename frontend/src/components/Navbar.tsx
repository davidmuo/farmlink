import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-gray-900 tracking-tight">
          FarmLink
        </Link>
        <div className="flex items-center gap-2.5">
          <Link to="/login" className="btn-md btn-ghost text-gray-600">Sign in</Link>
          <Link to="/register" className="btn-md btn-primary">Get started</Link>
        </div>
      </div>
    </nav>
  );
}
