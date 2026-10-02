import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Wallet, BellRing, BarChart3, ShieldCheck, LogOut, Search, Bell, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/reminders', label: 'Reminders', icon: BellRing },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: ShieldCheck, adminOnly: true },
]

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const title = nav.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))?.label ?? 'Dashboard'

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-card p-4 flex flex-col transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-2 py-3 text-lg font-semibold text-brand">Consultancy CRM</div>
        <nav className="mt-4 flex-1 space-y-1">
          {nav.filter((n) => !n.adminOnly || isAdmin).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} className="btn-ghost justify-start"><LogOut size={18} />Logout</button>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-canvas/80 backdrop-blur px-4 py-3 lg:px-8">
          <button className="btn-ghost lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><Menu size={20} /></button>
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="relative ml-auto hidden sm:block w-72">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input className="input pl-9" placeholder="Search candidates (press Enter)" onKeyDown={(e) => { if (e.key === 'Enter' && e.target.value.trim()) navigate(`/candidates?q=${encodeURIComponent(e.target.value.trim())}`) }} />
          </div>
          <button className="btn-ghost" aria-label="Reminders" onClick={() => navigate('/reminders')}><Bell size={18} /></button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent text-white grid place-items-center text-sm font-semibold">{user.name[0]}</div>
            <div className="hidden md:block leading-tight">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-slate-500">{isAdmin ? 'Super Admin' : 'Staff'}</p>
            </div>
          </div>
        </header>
        <main className="px-4 pb-10 pt-2 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
