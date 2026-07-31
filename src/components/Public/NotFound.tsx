import { Link } from 'react-router-dom';

export const NotFound = () => (
  <div className="max-w-[1000px] mx-auto px-4 md:px-8 py-24 text-center">
    <h1 className="text-3xl font-black uppercase tracking-tight mb-4">Page not found</h1>
    <p className="text-sm text-gray-600 mb-8">The page you requested does not exist.</p>
    <Link to="/" className="text-[10px] font-bold uppercase tracking-widest border-b-2 border-black">
      ← Back to exhibitions
    </Link>
  </div>
);
