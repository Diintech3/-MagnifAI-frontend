import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f0f4f8] px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <div className="text-3xl font-bold text-slate-900">404</div>
        <p className="mt-2 text-slate-500">Page not found.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-[#2563eb] px-5 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
