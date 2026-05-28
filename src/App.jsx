import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import PrivateRoute from './components/PrivateRoute'
import DashboardPage from './pages/DashboardPage'
import PayParity from './pages/PayParity'
import ExpensesPage from './pages/ExpensesPage'
import GoalsPage from './pages/GoalsPage'
import InvestmentsPage from './pages/InvestmentsPage'
import GovernmentSchemesPage from './pages/GovernmentSchemesPage'
import TaxationPage from './pages/TaxationPage'
import ChatbotPage from './pages/ChatbotPage'
import DocumentsPage from './pages/DocumentsPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import SavingsPage from './pages/SavingsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="pay-parity" element={<PayParity />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="savings" element={<SavingsPage />} />
        <Route path="investments" element={<InvestmentsPage />} />
        <Route path="government-schemes" element={<GovernmentSchemesPage />} />
        <Route path="taxation" element={<TaxationPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
