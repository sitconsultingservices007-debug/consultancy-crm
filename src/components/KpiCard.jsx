export default function KpiCard({ label, value, icon: Icon, tone = 'brand' }) {
  const tones = { brand: 'bg-blue-50 text-brand', success: 'bg-emerald-50 text-success', accent: 'bg-violet-50 text-accent', warn: 'bg-amber-50 text-warn' }
  return (
    <div className="card flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl grid place-items-center ${tones[tone]}`}><Icon size={20} /></div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  )
}
