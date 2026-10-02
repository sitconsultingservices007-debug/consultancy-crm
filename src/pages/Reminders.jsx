import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Check, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import ReminderForm from '../components/ReminderForm.jsx'
import { Badge, statusTone, Loading, ErrorBox, Empty, Segmented } from '../components/ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { listReminders, completeReminder, deleteReminder } from '../lib/services.js'
import { inr, shortDate, effStatus, toISO, todayISO } from '../lib/format.js'

export default function Reminders() {
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState('list'), [q, setQ] = useState(''), [status, setStatus] = useState('')
  const [form, setForm] = useState(params.get('add') ? {} : null)
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  useEffect(() => { if (params.get('add')) setParams({}, { replace: true }) }, [])
  const { data, loading, error, reload } = useAsync(listReminders, [])

  const rows = useMemo(() => (data ?? []).map((r) => ({ ...r, eff: effStatus(r) })).filter((r) =>
    (!status || r.eff === status) && (!q || `${r.title} ${r.candidates?.full_name ?? ''}`.toLowerCase().includes(q.toLowerCase()))), [data, q, status])

  const done = async (r) => { try { await completeReminder(r.id); reload() } catch (e) { window.alert(e.message) } }
  const remove = async (r) => { if (window.confirm('Delete this reminder?')) { try { await deleteReminder(r.id); reload() } catch (e) { window.alert(e.message) } } }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={view} onChange={setView} options={[['list', 'List'], ['calendar', 'Calendar']]} />
        <div className="relative min-w-[200px] flex-1"><Search size={16} className="absolute left-3 top-2.5 text-slate-400" /><input className="input pl-9" placeholder="Search title or candidate" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status filter">
          <option value="">All statuses</option><option>Pending</option><option>Overdue</option><option>Completed</option>
        </select>
        <button className="btn-primary" onClick={() => setForm({})}><Plus size={16} />Add reminder</button>
      </div>
      <ErrorBox error={error} />
      {loading && !data ? <Loading /> : view === 'list' ? (
        <div className="space-y-3">
          {rows.length === 0 && <div className="card"><Empty>No reminders found. Add one to track a promised payment.</Empty></div>}
          {rows.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-slate-500">{r.candidates?.full_name} · {shortDate(r.reminder_date)}{r.notes ? ` · ${r.notes}` : ''}</p>
              </div>
              <span className="font-semibold">{inr(r.expected_amount)}</span>
              <Badge tone={statusTone[r.eff]}>{r.eff}</Badge>
              <div className="flex gap-1">
                {r.eff !== 'Completed' && <button className="btn-ghost !p-1.5 text-success" onClick={() => done(r)} aria-label="Mark complete" title="Mark complete"><Check size={18} /></button>}
                <button className="btn-ghost !p-1.5" onClick={() => setForm(r)} aria-label="Edit"><Pencil size={16} /></button>
                <button className="btn-ghost !p-1.5 text-danger" onClick={() => remove(r)} aria-label="Delete"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      ) : <Calendar month={month} setMonth={setMonth} rows={rows} onPick={setForm} />}
      {form && <ReminderForm initial={form.id ? form : undefined} onClose={() => setForm(null)} onSaved={reload} />}
    </div>
  )
}

function Calendar({ month, setMonth, rows, onPick }) {
  const y = month.getFullYear(), m = month.getMonth()
  const lead = (new Date(y, m, 1).getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const shift = (n) => setMonth(new Date(y, m + n, 1))
  const tone = { Pending: 'bg-amber-50 text-amber-700', Overdue: 'bg-red-50 text-red-600', Completed: 'bg-emerald-50 text-emerald-700' }
  return (
    <div className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1"><button className="btn-ghost !p-1.5" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button><button className="btn-ghost !p-1.5" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button></div>
      </div>
      <div className="overflow-x-auto"><div className="grid min-w-[640px] grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="px-1 pb-1 text-xs font-medium text-slate-500">{d}</div>)}
        {cells.map((d, i) => {
          const iso = d ? toISO(new Date(y, m, d)) : null
          const items = d ? rows.filter((r) => r.reminder_date === iso) : []
          return (
            <div key={i} className={`min-h-[84px] rounded-lg p-1 ${d ? 'bg-slate-50' : ''} ${iso === todayISO() ? 'ring-2 ring-brand/40' : ''}`}>
              {d && <p className="px-1 text-xs text-slate-500">{d}</p>}
              {items.map((r) => <button key={r.id} onClick={() => onPick(r)} className={`mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-xs ${tone[r.eff]}`}>{r.candidates?.full_name}: {inr(r.expected_amount)}</button>)}
            </div>
          )
        })}
      </div></div>
    </div>
  )
}
