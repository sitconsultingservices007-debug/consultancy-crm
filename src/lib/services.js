import { createClient } from '@supabase/supabase-js'
import { supabase, SUPABASE_URL, SUPABASE_KEY } from './supabase.js'

export const SERVICE_TYPES = ['Registration Fee', 'Company Documentation Fee', 'Interview Support Fee']
export const INCOME_CATS = [...SERVICE_TYPES, 'Other Income']
export const EXPENSE_CATS = ['Payment To Akash Sir', 'Office Expense', 'ChatGPT Subscription', 'Internet Recharge', 'SIM Recharge', 'Software Expense', 'Other Expense']
export const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque']
export const CAND_STATUS = ['Registered', 'Active', 'Placed', 'Inactive']

const ok = ({ data, error }) => { if (error) throw error; return data }
const num = (n) => Number(n || 0)

/* ---------- Candidates ---------- */
export async function listCandidates({ q = '', status = '', location = '', sort = 'created_at', asc = false, page = 0, size = 10 }) {
  let query = supabase.from('candidates').select('*', { count: 'exact' })
  const s = q.replace(/[,()%*]/g, ' ').trim()
  if (s) query = query.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`)
  if (status) query = query.eq('registration_status', status)
  if (location.trim()) query = query.ilike('location', `%${location.trim()}%`)
  const { data, error, count } = await query.order(sort, { ascending: asc }).range(page * size, page * size + size - 1)
  if (error) throw error
  const ids = data.map((c) => c.id)
  const svc = ids.length ? ok(await supabase.from('candidate_services').select('candidate_id, paid_amount, balance_amount').in('candidate_id', ids)) : []
  const rows = data.map((c) => {
    const mine = svc.filter((x) => x.candidate_id === c.id)
    return { ...c, total_paid: mine.reduce((a, x) => a + num(x.paid_amount), 0), balance_due: mine.reduce((a, x) => a + num(x.balance_amount), 0) }
  })
  return { rows, count: count ?? 0 }
}
export const candidateOptions = async () => ok(await supabase.from('candidates').select('id, full_name').order('full_name').limit(2000))
export const getCandidate = async (id) => ok(await supabase.from('candidates').select('*').eq('id', id).single())
export async function saveCandidate(values, id) {
  return id
    ? ok(await supabase.from('candidates').update(values).eq('id', id).select().single())
    : ok(await supabase.from('candidates').insert(values).select().single())
}
export async function deleteCandidate(c) {
  if (c.cv_url) await supabase.storage.from('cvs').remove([c.cv_url])
  ok(await supabase.from('candidates').delete().eq('id', c.id))
}

/* ---------- Candidate services (payment summary) ---------- */
export const listServices = async (candidateId) => ok(await supabase.from('candidate_services').select('*').eq('candidate_id', candidateId))
export async function setServiceTotal(candidateId, service_type, total_amount) {
  ok(await supabase.from('candidate_services').upsert({ candidate_id: candidateId, service_type, total_amount }, { onConflict: 'candidate_id,service_type' }))
}
// Keeps paid_amount in sync with income transactions (supports part payments)
async function adjustService(candidateId, category, delta) {
  if (!candidateId || !SERVICE_TYPES.includes(category) || !delta) return
  const { data } = await supabase.from('candidate_services').select('*').eq('candidate_id', candidateId).eq('service_type', category).maybeSingle()
  if (data) ok(await supabase.from('candidate_services').update({ paid_amount: Math.max(0, num(data.paid_amount) + delta) }).eq('id', data.id))
  else if (delta > 0) ok(await supabase.from('candidate_services').insert({ candidate_id: candidateId, service_type: category, total_amount: delta, paid_amount: delta }))
}
const effect = (t) => (t.transaction_type === 'income' ? num(t.amount) : 0)
export const listPending = async () => ok(await supabase.from('candidate_services').select('*, candidates(full_name)').gt('balance_amount', 0))

/* ---------- CV storage ---------- */
export async function uploadCv(candidate, file) {
  const path = `${candidate.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`
  const { error } = await supabase.storage.from('cvs').upload(path, file)
  if (error) throw error
  if (candidate.cv_url) await supabase.storage.from('cvs').remove([candidate.cv_url])
  ok(await supabase.from('candidates').update({ cv_url: path }).eq('id', candidate.id))
  return path
}
export async function cvLink(path) {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 120)
  if (error) throw error
  return data.signedUrl
}
export async function removeCv(candidate) {
  await supabase.storage.from('cvs').remove([candidate.cv_url])
  ok(await supabase.from('candidates').update({ cv_url: null }).eq('id', candidate.id))
}

/* ---------- Transactions ---------- */
export async function listTransactions({ candidateId } = {}) {
  let q = supabase.from('transactions').select('*, candidates(full_name)').order('txn_date', { ascending: false }).order('created_at', { ascending: false })
  if (candidateId) q = q.eq('candidate_id', candidateId)
  return ok(await q)
}
export async function addTransaction(t, userId) {
  const row = ok(await supabase.from('transactions').insert({ ...t, created_by: userId }).select().single())
  await adjustService(row.candidate_id, row.category, effect(row))
  return row
}
export async function updateTransaction(old, t) { // Super Admin only (enforced by RLS too)
  const row = ok(await supabase.from('transactions').update(t).eq('id', old.id).select().single())
  await adjustService(old.candidate_id, old.category, -effect(old))
  await adjustService(row.candidate_id, row.category, effect(row))
  return row
}
export async function deleteTransaction(t) { // Super Admin only
  ok(await supabase.from('transactions').delete().eq('id', t.id))
  await adjustService(t.candidate_id, t.category, -effect(t))
}

/* ---------- Reminders ---------- */
export const listReminders = async () => ok(await supabase.from('reminders').select('*, candidates(full_name)').order('reminder_date'))
export async function saveReminder(values, id) {
  return id ? ok(await supabase.from('reminders').update(values).eq('id', id)) : ok(await supabase.from('reminders').insert(values))
}
export const completeReminder = async (id) => ok(await supabase.from('reminders').update({ status: 'Completed' }).eq('id', id))
export const deleteReminder = async (id) => ok(await supabase.from('reminders').delete().eq('id', id))

/* ---------- Users (Super Admin) ---------- */
export const listUsers = async () => ok(await supabase.from('users').select('*').order('created_at'))
export async function createUser({ name, email, password, role }) {
  // Separate non-persistent client so the admin's own session is not replaced
  const tmp = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { data, error } = await tmp.auth.signUp({ email, password, options: { data: { name } } })
  if (error) throw error
  if (!data.user) throw new Error('Could not create the login. Try again.')
  ok(await supabase.from('users').insert({ id: data.user.id, name, email, role, status: 'active' }))
}
export const updateUser = async (id, values) => ok(await supabase.from('users').update(values).eq('id', id))
