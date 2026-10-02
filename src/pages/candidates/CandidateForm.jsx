import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Field, ErrorBox, Loading } from '../../components/ui.jsx'
import { getCandidate, saveCandidate, CAND_STATUS } from '../../lib/services.js'

const EMPTY = { full_name: '', phone: '', email: '', location: '', preferred_locations: '', degree: '', stream: '', passout_year: '', previous_companies: '', current_company: '', current_role: '', total_experience: '', pf_available: 'false', skills: '', notice_period: '', current_ctc: '', expected_ctc: '', registration_status: 'Registered' }
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)
const numOrNull = (s) => (s === '' ? null : Number(s))

function validate(v) {
  const e = {}
  if (!v.full_name.trim()) e.full_name = 'Enter the full name'
  const phone = v.phone.replace(/[\s-]/g, '').replace(/^\+91/, '')
  if (!/^\d{10}$/.test(phone)) e.phone = 'Enter a 10-digit mobile number'
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Enter a valid email address'
  if (!v.location.trim()) e.location = 'Enter the current location'
  const y = Number(v.passout_year)
  if (v.passout_year !== '' && (!Number.isInteger(y) || y < 1980 || y > new Date().getFullYear() + 5)) e.passout_year = 'Enter a valid year'
  if (v.total_experience !== '' && (Number(v.total_experience) < 0 || Number(v.total_experience) > 60)) e.total_experience = 'Enter 0 to 60 years'
  ;['current_ctc', 'expected_ctc'].forEach((k) => { if (v[k] !== '' && Number(v[k]) < 0) e[k] = 'Cannot be negative' })
  return e
}

export default function CandidateForm() {
  const { id } = useParams()
  const nav = useNavigate()
  const [v, setV] = useState(EMPTY), [loading, setLoading] = useState(Boolean(id))
  const [errors, setErrors] = useState({}), [err, setErr] = useState(null), [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getCandidate(id).then((c) => {
      setV({ ...EMPTY, ...Object.fromEntries(Object.entries(c).map(([k, x]) => [k, Array.isArray(x) ? x.join(', ') : x ?? ''])), pf_available: String(c.pf_available) })
      setLoading(false)
    }).catch((e) => { setErr(e); setLoading(false) })
  }, [id])

  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const text = (k, extra = {}) => <input className="input" value={v[k]} onChange={set(k)} {...extra} />

  async function submit(e) {
    e.preventDefault()
    const er = validate(v); setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true); setErr(null)
    const row = {
      full_name: v.full_name.trim(), phone: v.phone.replace(/[\s-]/g, '').replace(/^\+91/, ''), email: v.email.trim() || null, location: v.location.trim(),
      preferred_locations: list(v.preferred_locations), degree: v.degree.trim() || null, stream: v.stream.trim() || null, passout_year: numOrNull(v.passout_year),
      previous_companies: list(v.previous_companies), current_company: v.current_company.trim() || null, current_role: v.current_role.trim() || null,
      total_experience: numOrNull(v.total_experience), pf_available: v.pf_available === 'true', skills: list(v.skills), notice_period: v.notice_period.trim() || null,
      current_ctc: numOrNull(v.current_ctc), expected_ctc: numOrNull(v.expected_ctc), registration_status: v.registration_status,
    }
    try { const saved = await saveCandidate(row, id); nav(`/candidates/${saved.id}`) } catch (e2) { setErr(e2); setBusy(false) }
  }
  if (loading) return <Loading />

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
      <h2 className="text-lg font-semibold">{id ? 'Edit candidate' : 'Add candidate'}</h2>
      <section className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Contact</h3>
        <Field label="Full name" error={errors.full_name}>{text('full_name')}</Field>
        <Field label="Contact number" error={errors.phone}>{text('phone', { inputMode: 'tel' })}</Field>
        <Field label="Email ID" error={errors.email}>{text('email', { type: 'email' })}</Field>
        <Field label="Current location" error={errors.location}>{text('location')}</Field>
        <Field label="Preferred job locations (comma separated)" className="sm:col-span-2">{text('preferred_locations')}</Field>
      </section>
      <section className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Education and work</h3>
        <Field label="Degree">{text('degree')}</Field>
        <Field label="Stream">{text('stream')}</Field>
        <Field label="Year of passout" error={errors.passout_year}>{text('passout_year', { type: 'number' })}</Field>
        <Field label="Total experience (years)" error={errors.total_experience}>{text('total_experience', { type: 'number', step: '0.1', min: 0 })}</Field>
        <Field label="Current company">{text('current_company')}</Field>
        <Field label="Current role">{text('current_role')}</Field>
        <Field label="Previous companies (comma separated)" className="sm:col-span-2">{text('previous_companies')}</Field>
        <Field label="Skills (comma separated)" className="sm:col-span-2">{text('skills')}</Field>
      </section>
      <section className="card grid gap-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Compensation and status</h3>
        <Field label="Current CTC (₹ per year)" error={errors.current_ctc}>{text('current_ctc', { type: 'number', min: 0, step: 'any' })}</Field>
        <Field label="Expected CTC (₹ per year)" error={errors.expected_ctc}>{text('expected_ctc', { type: 'number', min: 0, step: 'any' })}</Field>
        <Field label="Notice period">{text('notice_period', { placeholder: 'e.g. 30 days' })}</Field>
        <Field label="PF available"><select className="input" value={v.pf_available} onChange={set('pf_available')}><option value="true">Yes</option><option value="false">No</option></select></Field>
        <Field label="Registration status"><select className="input" value={v.registration_status} onChange={set('registration_status')}>{CAND_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
      </section>
      <ErrorBox error={err} />
      <div className="flex justify-end gap-2">
        <Link to={id ? `/candidates/${id}` : '/candidates'} className="btn-ghost">Cancel</Link>
        <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Add candidate'}</button>
      </div>
    </form>
  )
}
