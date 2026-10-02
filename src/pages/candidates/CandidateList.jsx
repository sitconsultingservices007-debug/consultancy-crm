import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react'
import { useAsync, useDebounced } from '../../lib/hooks.js'
import { listCandidates, deleteCandidate, CAND_STATUS } from '../../lib/services.js'
import { inr, inrDec, shortDate } from '../../lib/format.js'
import { Badge, statusTone, Loading, ErrorBox, Empty, Pagination, Th } from '../../components/ui.jsx'

const SIZE = 10
export default function CandidateList() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(''), [location, setLocation] = useState('')
  const [sort, setSort] = useState('created_at'), [asc, setAsc] = useState(false), [page, setPage] = useState(0)
  const dq = useDebounced(q), dl = useDebounced(location)
  const { data, loading, error, reload } = useAsync(() => listCandidates({ q: dq, status, location: dl, sort, asc, page, size: SIZE }), [dq, status, dl, sort, asc, page])

  const sortBy = (k) => { if (sort === k) setAsc(!asc); else { setSort(k); setAsc(true) }; setPage(0) }
  async function remove(c) {
    if (!window.confirm(`Delete ${c.full_name}? Their payment summary and CV will also be removed.`)) return
    try { await deleteCandidate(c); reload() } catch (e) { window.alert(e.message) }
  }
  const th = (k, label) => <Th onClick={() => sortBy(k)} active={sort === k} asc={asc}>{label}</Th>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, phone or email" value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} />
        </div>
        <select className="input !w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="Status filter">
          <option value="">All statuses</option>{CAND_STATUS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input className="input !w-44" placeholder="Filter by location" value={location} onChange={(e) => { setLocation(e.target.value); setPage(0) }} />
        <Link to="/candidates/new" className="btn-primary"><Plus size={16} />Add candidate</Link>
      </div>
      <ErrorBox error={error} />
      <div className="card !p-2">
        {loading && !data ? <Loading /> : !data?.rows.length ? <Empty>No candidates match. Add a candidate or clear the filters.</Empty> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {th('full_name', 'Full name')}<Th>Contact</Th>{th('location', 'Location')}{th('total_experience', 'Experience')}{th('current_ctc', 'Current CTC')}{th('expected_ctc', 'Expected CTC')}<Th>Status</Th><Th>Total paid</Th><Th>Balance due</Th>{th('created_at', 'Created')}<Th>Actions</Th>
              </tr></thead>
              <tbody>
                {data.rows.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-medium"><Link to={`/candidates/${c.id}`} className="hover:text-brand">{c.full_name}</Link></td>
                    <td className="px-3 py-2.5">{c.phone}</td>
                    <td className="px-3 py-2.5">{c.location}</td>
                    <td className="px-3 py-2.5">{c.total_experience ?? 0} yrs</td>
                    <td className="px-3 py-2.5">{c.current_ctc ? inrDec(c.current_ctc) : '-'}</td>
                    <td className="px-3 py-2.5">{c.expected_ctc ? inrDec(c.expected_ctc) : '-'}</td>
                    <td className="px-3 py-2.5"><Badge tone={statusTone[c.registration_status]}>{c.registration_status}</Badge></td>
                    <td className="px-3 py-2.5 text-success">{inr(c.total_paid)}</td>
                    <td className={`px-3 py-2.5 ${c.balance_due > 0 ? 'text-warn font-medium' : ''}`}>{inr(c.balance_due)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{shortDate(c.created_at)}</td>
                    <td className="px-3 py-2.5"><div className="flex gap-1">
                      <Link to={`/candidates/${c.id}`} className="btn-ghost !p-1.5" aria-label="View"><Eye size={16} /></Link>
                      <Link to={`/candidates/${c.id}/edit`} className="btn-ghost !p-1.5" aria-label="Edit"><Pencil size={16} /></Link>
                      <button className="btn-ghost !p-1.5 text-danger" onClick={() => remove(c)} aria-label="Delete"><Trash2 size={16} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-3 pb-2"><Pagination page={page} size={SIZE} total={data?.count ?? 0} onPage={setPage} /></div>
      </div>
    </div>
  )
}
