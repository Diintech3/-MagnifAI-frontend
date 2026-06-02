export function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold text-slate-900">{value ?? 0}</div>
    </div>
  );
}
