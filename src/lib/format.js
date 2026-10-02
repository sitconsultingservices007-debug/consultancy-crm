export const inr = (n = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
export const shortDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayISO = () => toISO(new Date())

// Date range presets used by Finance and Reports
export function rangeFor(preset, custom = {}) {
  const t = todayISO(), d = new Date(t + 'T00:00:00')
  if (preset === 'today') return [t, t]
  if (preset === 'week') { d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return [toISO(d), t] }
  if (preset === 'month') return [t.slice(0, 8) + '01', t]
  if (preset === 'custom') return [custom.from || '', custom.to || '']
  return ['', '']
}
export const inRange = (date, [from, to]) => (!from || date >= from) && (!to || date <= to)
export const effStatus = (r) => (r.status === 'Completed' ? 'Completed' : r.reminder_date < todayISO() ? 'Overdue' : 'Pending')

export function monthly(txs) {
  const m = {}
  txs.forEach((x) => {
    const k = x.txn_date.slice(0, 7)
    m[k] ??= { month: k, income: 0, expense: 0 }
    m[k][x.transaction_type] += Number(x.amount)
  })
  return Object.values(m).sort((a, b) => a.month.localeCompare(b.month))
}
export const sumType = (txs, type) => txs.filter((x) => x.transaction_type === type).reduce((a, x) => a + Number(x.amount), 0)
export function byCategory(txs, type) {
  const c = {}
  txs.filter((x) => x.transaction_type === type).forEach((x) => { c[x.category] = (c[x.category] ?? 0) + Number(x.amount) })
  return Object.entries(c).map(([name, value]) => ({ name, value }))
}

export const inrDec = (n = 0) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
