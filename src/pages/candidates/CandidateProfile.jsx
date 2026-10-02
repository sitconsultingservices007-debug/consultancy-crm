import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Pencil, Trash2, Upload, Download, FileText, Plus } from 'lucide-react'
import { useAsync } from '../../lib/hooks.js'
import { getCandidate, listServices, setServiceTotal, listTransactions, uploadCv, cvLink, removeCv, deleteCandidate, SERVICE_TYPES } from '../../lib/services.js'
import { inr, inrDec ,shortDate } from '../../lib/format.js'
import { Badge, statusTone, Loading, ErrorBox, Empty, Th, Segmented } from '../../components/ui.jsx'
import TransactionForm from '../../components/TransactionForm.jsx'

export default function CandidateProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const [tab, setTab] = useState('profile')
  const cand = useAsync(() => getCandidate(id), [id])
  if (cand.loading && !cand.data) return <Loading />
  if (cand.error) return <ErrorBox error={cand.error} />
  const c = cand.data

  async function remove() {
    if (!window.confirm(`Delete ${c.full_name}? This cannot be undone.`)) return
    try { await deleteCandidate(c); nav('/candidates') } catch (e) { window.alert(e.message) }
  }
  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-xl font-semibold text-brand">{c.full_name[0]}</div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{c.full_name}</h2>
          <p className="text-sm text-slate-500">{[c.current_role && c.current_company ? `${c.current_role} at ${c.current_company}` : c.current_role || c.current_company, c.location].filter(Boolean).join(', ')}</p>
        </div>
        <Badge tone={statusTone[c.registration_status]}>{c.registration_status}</Badge>
        <Link to={`/candidates/${id}/edit`} className="btn-ghost"><Pencil size={16} />Edit</Link>
        <button onClick={remove} className="btn-ghost text-danger"><Trash2 size={16} />Delete</button>
      </div>
      <Segmented value={tab} onChange={setTab} options={[['profile', 'Profile'], ['payments', 'Payment summary'], ['transactions', 'Transactions'], ['documents', 'Documents']]} />
      {tab === 'profile' && <ProfileTab c={c} />}
      {tab === 'payments' && <PaymentsTab c={c} />}
      {tab === 'transactions' && <TransactionsTab c={c} />}
      {tab === 'documents' && <DocumentsTab c={c} onChange={cand.reload} />}
    </div>
  )
}

function ProfileTab({ c }) {
  const rows = [
    ['Contact number', c.phone], ['Email ID', c.email], ['Current location', c.location], ['Preferred job locations', c.preferred_locations?.join(', ')],
    ['Degree', c.degree], ['Stream', c.stream], ['Year of passout', c.passout_year], ['Previous companies', c.previous_companies?.join(', ')],
    ['Current company', c.current_company], ['Current role', c.current_role], ['Total experience', c.total_experience != null ? `${c.total_experience} years` : null],
    ['PF available', c.pf_available ? 'Yes' : 'No'], ['Skills', c.skills?.join(', ')], ['Notice period', c.notice_period],
    ['Current CTC', c.current_ctc ? inrDec(c.current_ctc) : null], ['Expected CTC', c.expected_ctc ? inrDec(c.expected_ctc) : null], ['Added on', shortDate(c.created_at)],
  ]
  return (
    <div className="card grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([k, val]) => (<div key={k}><p className="text-xs text-slate-500">{k}</p><p className="text-sm font-medium">{val || '-'}</p></div>))}
    </div>
  )
}

function PaymentsTab({ c }) {
  const svc = useAsync(() => listServices(c.id), [c.id])
  const [pay, setPay] = useState(null)
  if (svc.loading && !svc.data) return <Loading />
  return (
    <div className="space-y-4">
      <ErrorBox error={svc.error} />
      <div className="grid gap-4 md:grid-cols-3">
        {SERVICE_TYPES.map((type) => (
          <ServiceCard key={type} type={type} row={svc.data?.find((s) => s.service_type === type)} candidateId={c.id} onSaved={svc.reload} onPay={() => setPay(type)} />
        ))}
      </div>
      {pay && <TransactionForm defaults={{ candidate_id: c.id, transaction_type: 'income', category: pay }} onClose={() => setPay(null)} onSaved={svc.reload} />}
    </div>
  )
}

function ServiceCard({ type, row, candidateId, onSaved, onPay }) {
  const [editing, setEditing] = useState(false), [total, setTotal] = useState(''), [err, setErr] = useState('')
  const t = Number(row?.total_amount ?? 0), p = Number(row?.paid_amount ?? 0), b = t - p
  const pct = t > 0 ? Math.min(100, (p / t) * 100) : 0
  async function save() {
    if (!(Number(total) >= p)) { setErr(`Total cannot be less than the ${inr(p)} already paid`); return }
    try { await setServiceTotal(candidateId, type, Number(total)); setEditing(false); setErr(''); onSaved() } catch (e) { setErr(e.message) }
  }
  return (
    <div className="card space-y-3">
      <h3 className="font-semibold">{type}</h3>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} /></div>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-slate-500">Total amount</dt><dd className="font-medium">{inr(t)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Paid</dt><dd className="font-medium text-success">{inr(p)}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Balance</dt><dd className={`font-medium ${b > 0 ? 'text-warn' : ''}`}>{inr(b)}</dd></div>
      </dl>
      {editing ? (
        <div className="space-y-2">
          <input type="number" min="0" className="input" placeholder="Total amount" value={total} onChange={(e) => setTotal(e.target.value)} />
          {err && <p className="text-xs text-danger">{err}</p>}
          <div className="flex gap-2"><button className="btn-primary" onClick={save}>Save total</button><button className="btn-ghost" onClick={() => { setEditing(false); setErr('') }}>Cancel</button></div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="btn-primary" onClick={onPay}><Plus size={16} />Record payment</button>
          <button className="btn-ghost" onClick={() => { setTotal(String(t || '')); setEditing(true) }}>Set total</button>
        </div>
      )}
    </div>
  )
}

function TransactionsTab({ c }) {
  const tx = useAsync(() => listTransactions({ candidateId: c.id }), [c.id])
  if (tx.loading && !tx.data) return <Loading />
  return (
    <div className="card !p-2">
      <ErrorBox error={tx.error} />
      {!tx.data?.length ? <Empty>No transactions for this candidate yet.</Empty> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100"><Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Amount</Th><Th>Method</Th><Th>Notes</Th></tr></thead>
          <tbody>{tx.data.map((t) => (
            <tr key={t.id} className="border-b border-slate-50">
              <td className="whitespace-nowrap px-3 py-2.5">{shortDate(t.txn_date)}</td>
              <td className="px-3 py-2.5"><Badge tone={t.transaction_type === 'income' ? 'green' : 'red'}>{t.transaction_type}</Badge></td>
              <td className="px-3 py-2.5">{t.category}</td>
              <td className={`px-3 py-2.5 font-medium ${t.transaction_type === 'income' ? 'text-success' : 'text-danger'}`}>{inr(t.amount)}</td>
              <td className="px-3 py-2.5">{t.payment_method}</td>
              <td className="px-3 py-2.5 text-slate-500">{t.notes}</td>
            </tr>))}</tbody>
        </table></div>
      )}
    </div>
  )
}

function DocumentsTab({ c, onChange }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false), [err, setErr] = useState(null)
  async function upload(e) {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setErr(new Error('The file is larger than 5 MB. Choose a smaller CV.')); return }
    setBusy(true); setErr(null)
    try { await uploadCv(c, f); onChange() } catch (e2) { setErr(e2) }
    setBusy(false)
  }
  async function download() { try { window.open(await cvLink(c.cv_url), '_blank') } catch (e) { setErr(e) } }
  async function remove() {
    if (!window.confirm('Remove this CV?')) return
    try { await removeCv(c); onChange() } catch (e) { setErr(e) }
  }
  return (
    <div className="card space-y-4">
      <ErrorBox error={err} />
      {c.cv_url ? (
        <div className="flex flex-wrap items-center gap-3">
          <FileText className="text-brand" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.cv_url.split('/').pop().replace(/^\d+-/, '')}</span>
          <button className="btn-primary" onClick={download}><Download size={16} />Download CV</button>
          <button className="btn-ghost text-danger" onClick={remove}><Trash2 size={16} />Remove</button>
        </div>
      ) : <p className="text-sm text-slate-500">No CV uploaded yet.</p>}
      <input ref={input} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={upload} />
      <button className="btn-ghost border border-slate-200" disabled={busy} onClick={() => input.current.click()}><Upload size={16} />{busy ? 'Uploading…' : c.cv_url ? 'Replace CV' : 'Upload CV'}</button>
    </div>
  )
}
