import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { supabase, isConfigured } from '../lib/supabase.js'
import { Field, ErrorBox } from '../components/ui.jsx'

const EMPTY = { full_name: '', phone: '', email: '', location: '', preferred_locations: '', degree: '', stream: '', passout_year: '', previous_companies: '', current_company: '', current_role: '', total_experience: '', pf_available: 'false', skills: '', notice_period: '', current_ctc: '', expected_ctc: '', website: '' }
const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)
const numOrNull = (s) => (s === '' ? null : Number(s))

function validate(v) {
  const e = {}
  if (!v.full_name.trim()) e.full_name = 'Please enter your full name'
  const phone = v.phone.replace(/[\s-]/g, '').replace(/^\+91/, '')
  if (!/^\d{10}$/.test(phone)) e.phone = 'Please enter a 10-digit mobile number'
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = 'Please enter a valid email address'
  if (!v.location.trim()) e.location = 'Please enter your current location'
  const y = Number(v.passout_year)
  if (v.passout_year !== '' && (!Number.isInteger(y) || y < 1980 || y > new Date().getFullYear() + 5)) e.passout_year = 'Please enter a valid year'
  if (v.total_experience !== '' && (Number(v.total_experience) < 0 || Number(v.total_experience) > 60)) e.total_experience = 'Enter 0 to 60 years'
  ;['current_ctc', 'expected_ctc'].forEach((k) => { if (v[k] !== '' && Number(v[k]) < 0) e[k] = 'Cannot be negative' })
  return e
}

export default function Apply() {
  const [v, setV] = useState(EMPTY)
  const [errors, setErrors] = useState({}), [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  const text = (k, extra = {}) => <input className="input" value={v[k]} onChange={set(k)} {...extra} />

  async function submit(e) {
    e.preventDefault()
    const er = validate(v); setErrors(er)
    if (Object.keys(er).length) return
    if (v.website) { setDone(true); return } // hidden spam-trap field was filled, so ignore silently
    setBusy(true); setErr(null)
    const { error } = await supabase.from('candidates').insert({
      full_name: v.full_name.trim(), phone: v.phone.replace(/[\s-]/g, '').replace(/^\+91/, ''), email: v.email.trim() || null, location: v.location.trim(),
      preferred_locations: list(v.preferred_locations), degree: v.degree.trim() || null, stream: v.stream.trim() || null, passout_year: numOrNull(v.passout_year),
      previous_companies: list(v.previous_companies), current_company: v.current_company.trim() || null, current_role: v.current_role.trim() || null,
      total_experience: numOrNull(v.total_experience), pf_available: v.pf_available === 'true', skills: list(v.skills), notice_period: v.notice_period.trim() || null,
      current_ctc: numOrNull(v.current_ctc), expected_ctc: numOrNull(v.expected_ctc), registration_status: 'Registered',
    })
    setBusy(false)
    if (error) setErr(new Error('Sorry, we could not submit your details. Please try again.'))
    else setDone(true)
  }

  if (done) return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="card max-w-sm space-y-3 text-center">
        <CheckCircle2 className="mx-auto text-success" size={40} />
        <h1 className="text-lg font-semibold">Thank you!</h1>
        <p className="text-sm text-slate-500">Your details have been submitted. Our team will contact you soon.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5">
        <div><h1 className="text-xl font-semibold text-brand">Candidate registration</h1><p className="text-sm text-slate-500">Please fill in your details. Fields marked * are required.</p></div>
        {!isConfigured && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This form is not connected yet.</p>}
        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label="Full name *" error={errors.full_name}>{text('full_name')}</Field>
          <Field label="Mobile number *" error={errors.phone}>{text('phone', { inputMode: 'tel' })}</Field>
          <Field label="Email ID" error={errors.email}>{text('email', { type: 'email' })}</Field>
          <Field label="Current location *" error={errors.location}>{text('location')}</Field>
          <Field label="Preferred job locations (comma separated)" className="sm:col-span-2">{text('preferred_locations')}</Field>
        </section>
        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label="Degree">{text('degree')}</Field>
          <Field label="Stream">{text('stream')}</Field>
          <Field label="Year of passout" error={errors.passout_year}>{text('passout_year', { type: 'number' })}</Field>
          <Field label="Total experience (years)" error={errors.total_experience}>{text('total_experience', { type: 'number', step: 'any', min: 0 })}</Field>
          <Field label="Current company">{text('current_company')}</Field>
          <Field label="Current role">{text('current_role')}</Field>
          <Field label="Previous companies (comma separated)" className="sm:col-span-2">{text('previous_companies')}</Field>
          <Field label="Skills (comma separated)" className="sm:col-span-2">{text('skills')}</Field>
        </section>
        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label="Current CTC (₹ per year)" error={errors.current_ctc}>{text('current_ctc', { type: 'number', min: 0, step: 'any' })}</Field>
          <Field label="Expected CTC (₹ per year)" error={errors.expected_ctc}>{text('expected_ctc', { type: 'number', min: 0, step: 'any' })}</Field>
          <Field label="Notice period">{text('notice_period', { placeholder: 'e.g. 30 days' })}</Field>
          <Field label="PF available"><select className="input" value={v.pf_available} onChange={set('pf_available')}><option value="true">Yes</option><option value="false">No</option></select></Field>
        </section>
        <input className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" value={v.website} onChange={set('website')} />
        <ErrorBox error={err} />
        <button className="btn-primary w-full justify-center" disabled={busy || !isConfigured}>{busy ? 'Submitting…' : 'Submit'}</button>
      </form>
    </div>
  )
}