import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, PiggyBank, Hourglass, Users, UserCheck, AlarmClock, UserPlus, ReceiptText, CalendarPlus } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import KpiCard from '../components/KpiCard.jsx'
import { supabase, isConfigured } from '../lib/supabase.js'
import { inr, shortDate, todayISO } from '../lib/format.js'

const COLORS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#EF4444']

// Demo data so the dashboard renders before Supabase is connected.
const d = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10)
const DEMO = {
  transactions: [
    { id: 1, transaction_type: 'income', category: 'Registration Fee', amount: 5000, txn_date: d(-40) },
    { id: 2, transaction_type: 'income', category: 'Interview Support Fee', amount: 4000, txn_date: d(-20) },
    { id: 3, transaction_type: 'expense', category: 'Office Expense', amount: 2500, txn_date: d(-18) },
    { id: 4, transaction_type: 'income', category: 'Company Documentation Fee', amount: 6000, txn_date: d(-5) },
    { id: 5, transaction_type: 'expense', category: 'Internet Recharge', amount: 900, txn_date: d(-3) },
  ],
  candidates: [
    { id: 1, full_name: 'Rohan Patil', location: 'Pune', total_experience: 3, created_at: d(-2) },
    { id: 2, full_name: 'Sneha Kulkarni', location: 'Mumbai', total_experience: 5, created_at: d(-6) },
  ],
  reminders: [{ id: 1, title: 'Interview support balance', reminder_date: d(2), expected_amount: 6000, status: 'Pending', candidates: { full_name: 'Rohan Patil' } }],
  services: [{ id: 1, balance_amount: 6000, candidates: { full_name: 'Rohan Patil' }, service_type: 'Interview Support Fee' }],
  counts: { total: 2, active: 2, overdue: 0 },
}

export default function Dashboard() {
  const [data, setData] = useState(isConfigured ? null : DEMO)

  useEffect(() => {
    if (!isConfigured) return
    ;(async () => {
      const [t, c, r, s, tc, ac, od] = await Promise.all([
        supabase.from('transactions').select('*').order('txn_date', { ascending: false }),
        supabase.from('candidates').select('id, full_name, location, total_experience, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('reminders').select('*, candidates(full_name)').eq('status', 'Pending').order('reminder_date').limit(5),
        supabase.from('candidate_services').select('*, candidates(full_name)').gt('balance_amount', 0),
        supabase.from('candidates').select('id', { count: 'exact', head: true }),
        supabase.from('candidates').select('id', { count: 'exact', head: true }).in('registration_status', ['Registered', 'Active']),
        supabase.from('reminders').select('id', { count: 'exact', head: true }).neq('status', 'Completed').lt('reminder_date', todayISO()),
      ])
      setData({ transactions: t.data ?? [], candidates: c.data ?? [], reminders: r.data ?? [], services: s.data ?? [], counts: { total: tc.count ?? 0, active: ac.count ?? 0, overdue: od.count ?? 0 } })
    })()
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const sum = (type) => data.transactions.filter((x) => x.transaction_type === type).reduce((a, x) => a + Number(x.amount), 0)
    const income = sum('income'), expense = sum('expense')
    const pending = data.services.reduce((a, x) => a + Number(x.balance_amount), 0)
    const months = {}
    data.transactions.forEach((x) => {
      const m = x.txn_date.slice(0, 7)
      months[m] ??= { month: m, income: 0, expense: 0 }
      months[m][x.transaction_type] += Number(x.amount)
    })
    const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
    const cats = {}
    data.transactions.filter((x) => x.transaction_type === 'income').forEach((x) => { cats[x.category] = (cats[x.category] ?? 0) + Number(x.amount) })
    return { income, expense, profit: income - expense, pending, monthly, pie: Object.entries(cats).map(([name, value]) => ({ name, value })) }
  }, [data])

  if (!stats) return <div className="card text-slate-500">Loading dashboard…</div>

  return (
    <div className="space-y-5">
      {!isConfigured && <div className="rounded-xl bg-amber-50 text-amber-800 text-sm px-4 py-2">Showing demo data. Add your Supabase keys in <code>.env</code> to see live numbers.</div>}

      <div className="flex flex-wrap gap-2">
        <Link to="/candidates/new" className="btn-primary"><UserPlus size={16} />Add candidate</Link>
        <Link to="/finance?add=1" className="btn-ghost border border-slate-200 bg-white"><ReceiptText size={16} />Add transaction</Link>
        <Link to="/reminders?add=1" className="btn-ghost border border-slate-200 bg-white"><CalendarPlus size={16} />Add reminder</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total income" value={inr(stats.income)} icon={TrendingUp} tone="success" />
        <KpiCard label="Total expense" value={inr(stats.expense)} icon={TrendingDown} tone="warn" />
        <KpiCard label="Net profit" value={inr(stats.profit)} icon={PiggyBank} tone="brand" />
        <KpiCard label="Pending collection" value={inr(stats.pending)} icon={Hourglass} tone="accent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total candidates" value={data.counts?.total ?? 0} icon={Users} tone="brand" />
        <KpiCard label="Active candidates" value={data.counts?.active ?? 0} icon={UserCheck} tone="success" />
        <KpiCard label="Overdue reminders" value={data.counts?.overdue ?? 0} icon={AlarmClock} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="font-semibold mb-3">Monthly revenue</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthly}><CartesianGrid vertical={false} stroke="#EEF2F7" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={inr} /><Bar dataKey="income" fill="#2563EB" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h2 className="font-semibold mb-3">Income by service</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={stats.pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>{stats.pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={inr} /><Legend /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Income vs expense</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={stats.monthly}><CartesianGrid vertical={false} stroke="#EEF2F7" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={inr} /><Legend /><Line dataKey="income" stroke="#10B981" strokeWidth={2.5} dot={false} /><Line dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={false} /></LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Widget title="Upcoming reminders" empty="No pending reminders" items={data.reminders.map((r) => ({ k: r.id, a: r.title, b: `${r.candidates?.full_name ?? ''} · ${shortDate(r.reminder_date)}`, c: inr(r.expected_amount) }))} />
        <Widget title="Recent transactions" empty="No transactions yet" items={data.transactions.slice(0, 5).map((t) => ({ k: t.id, a: t.category, b: shortDate(t.txn_date), c: (t.transaction_type === 'income' ? '+' : '-') + inr(t.amount), tone: t.transaction_type === 'income' ? 'text-success' : 'text-danger' }))} />
        <Widget title="Recent candidates" empty="No candidates yet" items={data.candidates.map((c) => ({ k: c.id, a: c.full_name, b: c.location, c: `${c.total_experience ?? 0} yrs` }))} />
        <Widget title="Pending payments" empty="Nothing pending" items={data.services.slice(0, 5).map((s) => ({ k: s.id, a: s.candidates?.full_name, b: s.service_type, c: inr(s.balance_amount), tone: 'text-warn' }))} />
      </div>
    </div>
  )
}

function Widget({ title, items, empty }) {
  return (
    <div className="card">
      <h2 className="font-semibold mb-3">{title}</h2>
      {items.length === 0 ? <p className="text-sm text-slate-400">{empty}</p> : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.k} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0"><p className="font-medium truncate">{i.a}</p><p className="text-xs text-slate-500 truncate">{i.b}</p></div>
              <span className={`font-medium whitespace-nowrap ${i.tone ?? ''}`}>{i.c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
