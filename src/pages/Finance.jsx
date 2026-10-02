import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, PiggyBank, Hourglass, AlarmClock } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import KpiCard from '../components/KpiCard.jsx'
import TransactionForm from '../components/TransactionForm.jsx'
import { Badge, Loading, ErrorBox, Empty, Segmented, Th } from '../components/ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { useAuth } from '../context/AuthContext.jsx'
import { listTransactions, deleteTransaction, listPending, listReminders } from '../lib/services.js'
import { inr, shortDate, rangeFor, inRange, monthly, sumType, byCategory, effStatus } from '../lib/format.js'

const COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444', '#0EA5E9', '#64748B']

export default function Finance() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [preset, setPreset] = useState('month'), [custom, setCustom] = useState({ from: '', to: '' })
  const [catType, setCatType] = useState('income')
  const [form, setForm] = useState(params.get('add') ? {} : null) // {} = new, tx = edit
  useEffect(() => { if (params.get('add')) setParams({}, { replace: true }) }, [])

  const tx = useAsync(listTransactions, [])
  const pending = useAsync(listPending, [])
  const rem = useAsync(listReminders, [])
  const reload = () => { tx.reload(); pending.reload() }

  const range = rangeFor(preset, custom)
  const rows = useMemo(() => (tx.data ?? []).filter((t) => preset === 'all' || inRange(t.txn_date, range)), [tx.data, preset, custom])
  const income = sumType(rows, 'income'), expense = sumType(rows, 'expense')
  const pendingTotal = (pending.data ?? []).reduce((a, s) => a + Number(s.balance_amount), 0)
  const overdueTotal = (rem.data ?? []).filter((r) => effStatus(r) === 'Overdue').reduce((a, r) => a + Number(r.expected_amount || 0), 0)
  const series = monthly(rows), cats = byCategory(rows, catType)

  async function remove(t) {
    if (!window.confirm(`Delete this ${t.transaction_type} of ${inr(t.amount)}?`)) return
    try { await deleteTransaction(t); reload() } catch (e) { window.alert(e.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={preset} onChange={setPreset} options={[['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['custom', 'Custom'], ['all', 'All time']]} />
        {preset === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input !w-auto" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} aria-label="From date" />
            <span className="text-slate-400">to</span>
            <input type="date" className="input !w-auto" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} aria-label="To date" />
          </div>
        )}
        <button className="btn-primary ml-auto" onClick={() => setForm({})}><Plus size={16} />Add transaction</button>
      </div>
      <ErrorBox error={tx.error || pending.error || rem.error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Total income" value={inr(income)} icon={TrendingUp} tone="success" />
        <KpiCard label="Total expense" value={inr(expense)} icon={TrendingDown} tone="warn" />
        <KpiCard label="Net profit" value={inr(income - expense)} icon={PiggyBank} tone="brand" />
        <KpiCard label="Pending collection" value={inr(pendingTotal)} icon={Hourglass} tone="accent" />
        <KpiCard label="Overdue collection" value={inr(overdueTotal)} icon={AlarmClock} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card"><h2 className="mb-3 font-semibold">Monthly revenue</h2>
          <ResponsiveContainer width="100%" height={230}><BarChart data={series}><CartesianGrid vertical={false} stroke="#EEF2F7" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={inr} /><Bar dataKey="income" fill="#2563EB" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <div className="card"><h2 className="mb-3 font-semibold">Income vs expense</h2>
          <ResponsiveContainer width="100%" height={230}><LineChart data={series}><CartesianGrid vertical={false} stroke="#EEF2F7" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={inr} /><Legend /><Line dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={false} /><Line dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div>
      </div>
      <div className="card">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Category breakdown</h2><Segmented value={catType} onChange={setCatType} options={[['income', 'Income'], ['expense', 'Expense']]} /></div>
        {cats.length === 0 ? <Empty>No {catType} in this period.</Empty> : (
          <ResponsiveContainer width="100%" height={240}><PieChart><Pie data={cats} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>{cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={inr} /><Legend /></PieChart></ResponsiveContainer>
        )}
      </div>

      <div className="card !p-2">
        <h2 className="px-3 pt-3 font-semibold">Transactions</h2>
        {tx.loading && !tx.data ? <Loading /> : rows.length === 0 ? <Empty>No transactions in this period.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100"><Th>Date</Th><Th>Type</Th><Th>Category</Th><Th>Candidate</Th><Th>Amount</Th><Th>Method</Th><Th>Notes</Th>{isAdmin && <Th>Actions</Th>}</tr></thead>
            <tbody>{rows.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-3 py-2.5">{shortDate(t.txn_date)}</td>
                <td className="px-3 py-2.5"><Badge tone={t.transaction_type === 'income' ? 'green' : 'red'}>{t.transaction_type}</Badge></td>
                <td className="px-3 py-2.5">{t.category}</td>
                <td className="px-3 py-2.5">{t.candidates?.full_name ?? '-'}</td>
                <td className={`px-3 py-2.5 font-medium ${t.transaction_type === 'income' ? 'text-success' : 'text-danger'}`}>{inr(t.amount)}</td>
                <td className="px-3 py-2.5">{t.payment_method}</td>
                <td className="max-w-[200px] truncate px-3 py-2.5 text-slate-500">{t.notes}</td>
                {isAdmin && <td className="px-3 py-2.5"><div className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setForm(t)} aria-label="Edit"><Pencil size={16} /></button>
                  <button className="btn-ghost !p-1.5 text-danger" onClick={() => remove(t)} aria-label="Delete"><Trash2 size={16} /></button>
                </div></td>}
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {form && <TransactionForm initial={form.id ? form : undefined} onClose={() => setForm(null)} onSaved={reload} />}
    </div>
  )
}
