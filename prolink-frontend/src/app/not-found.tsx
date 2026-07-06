import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-blue-500/30 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-2">Page not found</h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-2xl px-6 py-3 text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            Go Home
          </Link>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
