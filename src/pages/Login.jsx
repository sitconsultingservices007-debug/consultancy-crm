import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isConfigured } from '../lib/supabase.js'
import { Field } from '../components/ui.jsx'

export default function Login() {
  const { user, signIn, authError } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    const error = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setErr(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message)
    else nav('/')
  }
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <div><h1 className="text-xl font-semibold text-brand">Consultancy CRM</h1><p className="text-sm text-slate-500">Sign in to continue</p></div>
        {!isConfigured && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and restart.</p>}
        {(err || authError) && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err || authError}</p>}
        <Field label="Email"><input className="input" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <button className="btn-primary w-full justify-center" disabled={busy || !isConfigured}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}
