import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Loading } from './ui.jsx'

export default function RequireAuth({ admin = false }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center"><Loading /></div>
  if (!user) return <Navigate to="/login" replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}
