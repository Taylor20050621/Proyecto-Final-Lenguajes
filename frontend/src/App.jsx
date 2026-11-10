import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { getCurrentUser, isAuthenticated, logout } from './services/AuthService'
import Navbar from './components/Navbar'
import CatalogPage from './pages/CatalogPage'
import CreateGamePage from './pages/CreateGamePage'
import CreateFormPage from './pages/CreateFormPage'
import FeedbackResultsPage from './pages/FeedbackResultsPage'
import FormViewPage from './pages/FormViewPage'
import GameDashboardPage from './pages/GameDashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />
}

function RequireRole({ role, children }) {
  const user = getCurrentUser()
  return user?.role === role ? children : <Navigate to="/catalog" replace />
}

function HomePage() {
  const authenticated = isAuthenticated()

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">PLAYTESTING PLATFORM</span>
        <h1>Prueba mejores juegos indie.</h1>
        <p>Conecta creadores y testers para convertir prototipos en experiencias memorables.</p>
        {authenticated ? (
          <button type="button" className="button secondary" onClick={logout}>
            Cerrar sesión
          </button>
        ) : (
          <div className="hero-actions">
            <Link className="button primary" to="/login">Iniciar sesión</Link>
            <Link className="button secondary" to="/register">Crear cuenta</Link>
          </div>
        )}
      </section>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/catalog" element={<RequireAuth><CatalogPage /></RequireAuth>} />
        <Route path="/create-game" element={<RequireAuth><RequireRole role="CREATOR"><CreateGamePage /></RequireRole></RequireAuth>} />
        <Route path="/create-form" element={<RequireAuth><RequireRole role="CREATOR"><CreateFormPage /></RequireRole></RequireAuth>} />
        <Route path="/games/:gameId/form" element={<RequireAuth><RequireRole role="TESTER"><FormViewPage /></RequireRole></RequireAuth>} />
        <Route path="/games/:gameId/feedback" element={<RequireAuth><RequireRole role="CREATOR"><FeedbackResultsPage /></RequireRole></RequireAuth>} />
        <Route path="/dashboard/:gameId" element={<RequireAuth><RequireRole role="CREATOR"><GameDashboardPage /></RequireRole></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
