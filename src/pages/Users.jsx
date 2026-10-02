import { useState } from 'react'
import { Plus, Pencil, Ban, CheckCircle2 } from 'lucide-react'
import { Modal, Field, Badge, Loading, ErrorBox, Empty, Th } from '../components/ui.jsx'
import { useAsync } from '../lib/hooks.js'
import { useAuth } from '../context/AuthContext.jsx'
import { listUsers, createUser, updateUser } from '../lib/services.js'
import { shortDate } from '../lib/format.js'

export default function Users() {
  const { user: me } = useAuth()
  const { data, loading, error, reload } = useAsync(listUsers, [])
  const [form, setForm] = useState(null)
  const toggle = async (u) => {
    if (!window.confirm(`${u.status === 'active' ? 'Disable' : 'Enable'} ${u.name}?`)) return
    try { await updateUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' }); reload() } catch (e) { window.alert(e.message) }
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button className="btn-primary" onClick={() => setForm({})}><Plus size={16} />Add user</button></div>
      <ErrorBox error={error} />
      <div className="card !p-2">
        {loading && !data ? <Loading /> : !data?.length ? <Empty>No users yet.</Empty> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100"><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Status</Th><Th>Created</Th><Th>Actions</Th></tr></thead>
            <tbody>{data.map((u) => (
              <tr key={u.id} className="border-b border-slate-50">
                <td className="px-3 py-2.5 font-medium">{u.name}</td><td className="px-3 py-2.5">{u.email}</td>
                <td className="px-3 py-2.5"><Badge tone={u.role === 'super_admin' ? 'purple' : 'blue'}>{u.role === 'super_admin' ? 'Super Admin' : 'Staff'}</Badge></td>
                <td className="px-3 py-2.5"><Badge tone={u.status === 'active' ? 'green' : 'slate'}>{u.status}</Badge></td>
                <td className="px-3 py-2.5">{shortDate(u.created_at)}</td>
                <td className="px-3 py-2.5"><div className="flex gap-1">
                  <button className="btn-ghost !p-1.5" onClick={() => setForm(u)} aria-label="Edit"><Pencil size={16} /></button>
                  {u.id !== me.id && <button className={`btn-ghost !p-1.5 ${u.status === 'active' ? 'text-danger' : 'text-success'}`} onClick={() => toggle(u)} aria-label={u.status === 'active' ? 'Disable' : 'Enable'}>{u.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}</button>}
                </div></td>
              </tr>))}</tbody>
          </table></div>
        )}
      </div>
      {form && <UserForm initial={form.id ? form : null} isSelf={form.id === me.id} onClose={() => setForm(null)} onSaved={reload} />}
    </div>
  )
}

function UserForm({ initial, isSelf, onClose, onSaved }) {
  const [v, setV] = useState({ name: initial?.name ?? '', email: initial?.email ?? '', password: '', role: initial?.role ?? 'staff' })
  const [errors, setErrors] = useState({}), [err, setErr] = useState(null), [busy, setBusy] = useState(false)
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault()
    const er = {}
    if (!v.name.trim()) er.name = 'Enter a name'
    if (!initial) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) er.email = 'Enter a valid email address'
      if (v.password.length < 8) er.password = 'Use at least 8 characters'
    }
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true); setErr(null)
    try {
      initial ? await updateUser(initial.id, { name: v.name.trim(), role: v.role }) : await createUser({ name: v.name.trim(), email: v.email.trim(), password: v.password, role: v.role })
      onSaved(); onClose()
    } catch (e2) { setErr(e2); setBusy(false) }
  }
  return (
    <Modal title={initial ? 'Edit user' : 'Add user'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" error={errors.name}><input className="input" value={v.name} onChange={set('name')} /></Field>
        <Field label="Email" error={errors.email}><input className="input" type="email" value={v.email} onChange={set('email')} disabled={Boolean(initial)} /></Field>
        {!initial && <Field label="Temporary password" error={errors.password}><input className="input" type="password" autoComplete="new-password" value={v.password} onChange={set('password')} /></Field>}
        <Field label="Role"><select className="input" value={v.role} onChange={set('role')} disabled={isSelf}><option value="staff">Staff</option><option value="super_admin">Super Admin</option></select></Field>
        <ErrorBox error={err} />
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add user'}</button></div>
      </form>
    </Modal>
  )
}
