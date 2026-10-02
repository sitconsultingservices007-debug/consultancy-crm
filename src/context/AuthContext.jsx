import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase.js'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // row from public.users
  const [loading, setLoading] = useState(isConfigured)
  const [authError, setAuthError] = useState('')
  const userId = useRef(null) // remembers who is signed in, so a tab refocus doesn't reload everything

  async function loadProfile(session) {
    if (!session) { userId.current = null; setUser(null); setLoading(false); return }
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle()
    if (!data || data.status !== 'active') {
      setAuthError(!data ? 'This login has no CRM profile yet. Ask a Super Admin to add you.' : 'Your account is disabled. Contact a Super Admin.')
      await supabase.auth.signOut()
      userId.current = null
      setUser(null)
    } else { userId.current = data.id; setUser(data); setAuthError('') }
    setLoading(false)
  }

  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(({ data }) => loadProfile(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return // ignore token refresh and initial session
      if (event === 'SIGNED_IN' && session?.user.id === userId.current) return // same user, e.g. tab refocus
      if (event === 'SIGNED_IN') setLoading(true)
      setTimeout(() => loadProfile(session), 0) // avoid awaiting supabase inside the callback
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }
  const signOut = () => supabase?.auth.signOut()

  const value = { user, isAdmin: user?.role === 'super_admin', loading, authError, signIn, signOut }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}