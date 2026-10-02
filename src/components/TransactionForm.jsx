import { useState } from 'react'
import { Modal, Field, ErrorBox } from './ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { useAuth } from '../context/AuthContext.jsx'
import { candidateOptions, addTransaction, updateTransaction, INCOME_CATS, EXPENSE_CATS, PAY_METHODS } from '../lib/services.js'
import { todayISO } from '../lib/format.js'

// initial = existing transaction (edit, Super Admin only). defaults = prefilled values for a new one.
export default function TransactionForm({ initial, defaults = {}, onClose, onSaved }) {
  const { user, isAdmin } = useAuth()
  const { data: candidates } = useAsync(candidateOptions, [])
  const [v, setV] = useState(() => ({
    txn_date: todayISO(), transaction_type: 'income', candidate_id: '', category: 'Registration Fee', amount: '', payment_method: 'UPI', notes: '',
    ...defaults, ...(initial ? { ...initial, candidate_id: initial.candidate_id ?? '', notes: initial.notes ?? '', amount: String(initial.amount) } : {}),
  }))
  const [errors, setErrors] = useState({}), [err, setErr] = useState(null), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const cats = v.transaction_type === 'income' ? INCOME_CATS : EXPENSE_CATS
  const locked = initial && !isAdmin

  function setType(t) { setV({ ...v, transaction_type: t, category: (t === 'income' ? INCOME_CATS : EXPENSE_CATS)[0] }) }

  async function submit(e) {
    e.preventDefault()
    const er = {}
    if (!v.txn_date) er.txn_date = 'Choose a date'
    if (!(Number(v.amount) > 0)) er.amount = 'Enter an amount greater than 0'
    if (!v.category) er.category = 'Choose a category'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true); setErr(null)
    const row = { txn_date: v.txn_date, transaction_type: v.transaction_type, candidate_id: v.candidate_id || null, category: v.category, amount: Number(v.amount), payment_method: v.payment_method, notes: v.notes.trim() || null }
    try {
      initial ? await updateTransaction(initial, row) : await addTransaction(row, user.id)
      onSaved?.(); onClose()
    } catch (e2) { setErr(e2); setBusy(false) }
  }

  return (
    <Modal title={initial ? 'Edit transaction' : 'Add transaction'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {locked && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Only a Super Admin can edit transactions.</p>}
        <div className="grid grid-cols-2 gap-2">
          {['income', 'expense'].map((t) => (
            <button type="button" key={t} onClick={() => setType(t)} className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${v.transaction_type === t ? (t === 'income' ? 'border-success bg-emerald-50 text-success' : 'border-danger bg-red-50 text-danger') : 'border-slate-200 text-slate-500'}`}>{t}</button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" error={errors.txn_date}><input type="date" className="input" value={v.txn_date} onChange={set('txn_date')} /></Field>
          <Field label="Amount (₹)" error={errors.amount}><input type="number" min="0" step="1" className="input" value={v.amount} onChange={set('amount')} /></Field>
          <Field label="Category" error={errors.category}><select className="input" value={v.category} onChange={set('category')}>{cats.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Payment method"><select className="input" value={v.payment_method} onChange={set('payment_method')}>{PAY_METHODS.map((c) => <option key={c}>{c}</option>)}</select></Field>
        </div>
        <Field label="Candidate (optional)">
          <select className="input" value={v.candidate_id} onChange={set('candidate_id')}>
            <option value="">No candidate</option>
            {(candidates ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea rows={2} className="input" value={v.notes} onChange={set('notes')} /></Field>
        <ErrorBox error={err} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || locked}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}</button>
        </div>
      </form>
    </Modal>
  )
}
