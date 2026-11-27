import { Navigate, Route, Routes } from 'react-router-dom'
import { getCurrentUser, isAuthenticated } from './services/AuthService'
import Navbar from './components/Navbar'
import CatalogPage from './pages/CatalogPage'
import CreateGamePage from './pages/CreateGamePage'
import CreateFormPage from './pages/CreateFormPage'
import FeedbackResultsPage from './pages/FeedbackResultsPage'
import FormViewPage from './pages/FormViewPage'
import GameDashboardPage from './pages/GameDashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import LandingPage from './pages/LandingPage'
import { ToastProvider } from './contexts/ToastContext'
import CreatorMetricsPage from './pages/CreatorMetricsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import TesterHistoryPage from './pages/TesterHistoryPage'

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/" replace />
}

function RequireRole({ role, children }) {
  const user = getCurrentUser()
  return user?.role === role ? children : <Navigate to="/catalog" replace />
}

export default function App() {
  return (
    <ToastProvider>
      <Navbar />
      <div className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/tester/history" element={<RequireAuth><RequireRole role="TESTER"><TesterHistoryPage /></RequireRole></RequireAuth>} />
          <Route path="/leaderboard" element={<RequireAuth><LeaderboardPage /></RequireAuth>} />
          <Route path="/creator/metrics" element={<RequireAuth><RequireRole role="CREATOR"><CreatorMetricsPage /></RequireRole></RequireAuth>} />
          <Route path="/create-game" element={<RequireAuth><RequireRole role="CREATOR"><CreateGamePage /></RequireRole></RequireAuth>} />
          <Route path="/create-form" element={<RequireAuth><RequireRole role="CREATOR"><CreateFormPage /></RequireRole></RequireAuth>} />
          <Route path="/games/:gameId/form" element={<RequireAuth><RequireRole role="TESTER"><FormViewPage /></RequireRole></RequireAuth>} />
          <Route path="/games/:gameId/feedback" element={<RequireAuth><RequireRole role="CREATOR"><FeedbackResultsPage /></RequireRole></RequireAuth>} />
          <Route path="/dashboard/:gameId" element={<RequireAuth><RequireRole role="CREATOR"><GameDashboardPage /></RequireRole></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ToastProvider>
  )
}
