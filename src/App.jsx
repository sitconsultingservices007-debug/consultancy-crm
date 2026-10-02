import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CandidateList from './pages/candidates/CandidateList.jsx'
import CandidateForm from './pages/candidates/CandidateForm.jsx'
import CandidateProfile from './pages/candidates/CandidateProfile.jsx'
import Finance from './pages/Finance.jsx'
import Reminders from './pages/Reminders.jsx'
import Reports from './pages/Reports.jsx'
import Users from './pages/Users.jsx'
import Apply from './pages/Apply.jsx'  

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/apply" element={<Apply />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/new" element={<CandidateForm />} />
          <Route path="/candidates/:id" element={<CandidateProfile />} />
          <Route path="/candidates/:id/edit" element={<CandidateForm />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/reports" element={<Reports />} />
          <Route element={<RequireAuth admin />}><Route path="/users" element={<Users />} /></Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
