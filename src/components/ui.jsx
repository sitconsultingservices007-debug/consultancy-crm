import { X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`} role="dialog" aria-label={title}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
export function Field({ label, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}
const tones = { slate: 'bg-slate-100 text-slate-600', green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-700', blue: 'bg-blue-50 text-blue-700', purple: 'bg-violet-50 text-violet-700' }
export const Badge = ({ tone = 'slate', children }) => <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
export const statusTone = { Registered: 'blue', Active: 'green', Placed: 'purple', Inactive: 'slate', Pending: 'amber', Completed: 'green', Overdue: 'red' }

export const Loading = () => <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />Loading…</div>
export const ErrorBox = ({ error }) => error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error.message ?? String(error)}</div> : null
export const Empty = ({ children }) => <p className="p-6 text-center text-sm text-slate-400">{children}</p>

export function Pagination({ page, size, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / size))
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-slate-500">
      <span>{total === 0 ? 'No results' : `${page * size + 1}–${Math.min(total, (page + 1) * size)} of ${total}`}</span>
      <div className="flex items-center gap-1">
        <button className="btn-ghost !p-1.5" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={18} /></button>
        <span>Page {page + 1} of {pages}</span>
        <button className="btn-ghost !p-1.5" disabled={page + 1 >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={18} /></button>
      </div>
    </div>
  )
}
export const Segmented = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-lg bg-slate-100 p-1">
    {options.map(([v, l]) => (
      <button key={v} onClick={() => onChange(v)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${value === v ? 'bg-white text-brand shadow-sm' : 'text-slate-500'}`}>{l}</button>
    ))}
  </div>
)
export const Th = ({ children, onClick, active, asc }) => (
  <th className={`whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-slate-500 ${onClick ? 'cursor-pointer select-none hover:text-ink' : ''}`} onClick={onClick}>
    {children}{active ? (asc ? ' ↑' : ' ↓') : ''}
  </th>
)
