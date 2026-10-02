import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import KpiCard from '../components/KpiCard.jsx'
import { Segmented, Loading, ErrorBox, Empty, Th } from '../components/ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { Users, UserPlus, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { listTransactions, listPending } from '../lib/services.js'
import { inr, shortDate, rangeFor, inRange, monthly, sumType } from '../lib/format.js'
import { exportCSV, exportExcel } from '../lib/export.js'

async function loadCandidates() {
  const { data, error } = await supabase.from('candidates').select('id, full_name, phone, location, registration_status, created_at').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export default function Reports() {
  const [from, setFrom] = useState(() => rangeFor('month')[0]), [to, setTo] = useState(() => rangeFor('month')[1])
  const [tab, setTab] = useState('Income')
  const cands = useAsync(loadCandidates, []), tx = useAsync(listTransactions, []), pend = useAsync(listPending, [])
  const loading = (cands.loading && !cands.data) || (tx.loading && !tx.data) || (pend.loading && !pend.data)

  const sets = useMemo(() => {
    const r = [from, to]
    const t = (tx.data ?? []).filter((x) => inRange(x.txn_date, r))
    const c = cands.data ?? []
    const mk = (type) => t.filter((x) => x.transaction_type === type).map((x) => ({ Date: x.txn_date, Category: x.category, Candidate: x.candidates?.full_name ?? '', Amount: Number(x.amount), Method: x.payment_method ?? '', Notes: x.notes ?? '' }))
    const newOnes = c.filter((x) => inRange(x.created_at.slice(0, 10), r))
    return {
      stats: { total: c.length, fresh: newOnes.length, active: c.filter((x) => ['Registered', 'Active'].includes(x.registration_status)).length, income: sumType(t, 'income'), expense: sumType(t, 'expense') },
      Candidates: c.map((x) => ({ Name: x.full_name, Phone: x.phone, Location: x.location, Status: x.registration_status, Created: x.created_at.slice(0, 10) })),
      Income: mk('income'), Expense: mk('expense'),
      Profit: monthly(t).map((m) => ({ Month: m.month, Income: m.income, Expense: m.expense, Profit: m.income - m.expense })),
      Pending: (pend.data ?? []).map((s) => ({ Candidate: s.candidates?.full_name ?? '', Service: s.service_type, Total: Number(s.total_amount), Paid: Number(s.paid_amount), Balance: Number(s.balance_amount) })),
    }
  }, [cands.data, tx.data, pend.data, from, to])

  const rows = sets[tab], cols = rows[0] ? Object.keys(rows[0]) : []
  const money = new Set(['Amount', 'Income', 'Expense', 'Profit', 'Total', 'Paid', 'Balance'])
  const { stats } = sets
  const name = `report-${from || 'start'}-to-${to || 'today'}`

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">From<input type="date" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-sm">To<input type="date" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost border border-slate-200" onClick={() => exportCSV(rows, `${tab.toLowerCase()}-${name}`)}><Download size={16} />Export {tab} CSV</button>
          <button className="btn-primary" onClick={() => exportExcel({ Candidates: sets.Candidates, Income: sets.Income, Expense: sets.Expense, Profit: sets.Profit, Pending: sets.Pending }, name)}><FileSpreadsheet size={16} />Export Excel</button>
        </div>
      </div>
      <ErrorBox error={cands.error || tx.error || pend.error} />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total candidates" value={stats.total} icon={Users} tone="brand" />
        <KpiCard label="New in period" value={stats.fresh} icon={UserPlus} tone="accent" />
        <KpiCard label="Active candidates" value={stats.active} icon={UserCheck} tone="success" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-sm text-slate-500">Income</p><p className="text-xl font-semibold text-success">{inr(stats.income)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Expense</p><p className="text-xl font-semibold text-danger">{inr(stats.expense)}</p></div>
        <div className="card"><p className="text-sm text-slate-500">Profit</p><p className="text-xl font-semibold">{inr(stats.income - stats.expense)}</p></div>
      </div>
      <Segmented value={tab} onChange={setTab} options={[['Candidates', 'Candidates'], ['Income', 'Income'], ['Expense', 'Expense'], ['Profit', 'Profit'], ['Pending', 'Pending collection']]} />
      <div className="card !p-2">
        {loading ? <Loading /> : rows.length === 0 ? <Empty>No data for this report and date range.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">{cols.map((c) => <Th key={c}>{c}</Th>)}</tr></thead>
            <tbody>{rows.slice(0, 200).map((r, i) => (
              <tr key={i} className="border-b border-slate-50">{cols.map((c) => <td key={c} className="whitespace-nowrap px-3 py-2.5">{money.has(c) ? inr(r[c]) : c === 'Date' || c === 'Created' ? shortDate(r[c]) : r[c]}</td>)}</tr>
            ))}</tbody>
          </table>{rows.length > 200 && <p className="p-3 text-xs text-slate-400">Showing the first 200 rows. Export to get all {rows.length}.</p>}</div>
        )}
      </div>
    </div>
  )
}
