import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { isAuthenticated, logout } from './services/AuthService'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

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
      <header className="topbar">
        <Link className="brand" to="/">Playtesting<span>.</span></Link>
        <nav>
          <Link to="/login">Ingresar</Link>
          <Link to="/register">Registrarse</Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
