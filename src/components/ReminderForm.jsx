import { useState } from 'react'
import { Modal, Field, ErrorBox } from './ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { candidateOptions, saveReminder } from '../lib/services.js'
import { todayISO } from '../lib/format.js'

export default function ReminderForm({ initial, defaults = {}, onClose, onSaved }) {
  const { data: candidates } = useAsync(candidateOptions, [])
  const [v, setV] = useState(() => ({ candidate_id: '', title: '', reminder_date: todayISO(), expected_amount: '', notes: '', status: 'Pending', ...defaults, ...(initial ? { ...initial, notes: initial.notes ?? '', expected_amount: String(initial.expected_amount ?? '') } : {}) }))
  const [errors, setErrors] = useState({}), [err, setErr] = useState(null), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    const er = {}
    if (!v.candidate_id) er.candidate_id = 'Choose a candidate'
    if (!v.title.trim()) er.title = 'Enter a title'
    if (!v.reminder_date) er.reminder_date = 'Choose a date'
    if (v.expected_amount !== '' && Number(v.expected_amount) < 0) er.expected_amount = 'Amount cannot be negative'
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true); setErr(null)
    try {
      await saveReminder({ candidate_id: v.candidate_id, title: v.title.trim(), reminder_date: v.reminder_date, expected_amount: Number(v.expected_amount || 0), notes: v.notes.trim() || null, status: v.status === 'Completed' ? 'Completed' : 'Pending' }, initial?.id)
      onSaved?.(); onClose()
    } catch (e2) { setErr(e2); setBusy(false) }
  }
  return (
    <Modal title={initial ? 'Edit reminder' : 'Add reminder'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Candidate" error={errors.candidate_id}>
          <select className="input" value={v.candidate_id} onChange={set('candidate_id')}>
            <option value="">Select candidate</option>
            {(candidates ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </Field>
        <Field label="Title" error={errors.title}><input className="input" value={v.title} onChange={set('title')} placeholder="e.g. Interview support balance" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reminder date" error={errors.reminder_date}><input type="date" className="input" value={v.reminder_date} onChange={set('reminder_date')} /></Field>
          <Field label="Expected amount (₹)" error={errors.expected_amount}><input type="number" min="0" className="input" value={v.expected_amount} onChange={set('expected_amount')} /></Field>
        </div>
        {initial && <Field label="Status"><select className="input" value={v.status === 'Completed' ? 'Completed' : 'Pending'} onChange={set('status')}><option>Pending</option><option>Completed</option></select></Field>}
        <Field label="Notes"><textarea rows={2} className="input" value={v.notes} onChange={set('notes')} /></Field>
        <ErrorBox error={err} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add reminder'}</button>
        </div>
      </form>
    </Modal>
  )
}
