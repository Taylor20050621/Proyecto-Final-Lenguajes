import { Link, useLocation } from 'react-router-dom'
import { getCurrentUser, isAuthenticated, logout } from '../services/AuthService'

export default function Navbar() {
  useLocation()
  const authenticated = isAuthenticated()
  const user = getCurrentUser()

  return (
    <header className="topbar">
      <Link className="brand" to="/">Playtesting<span>.</span></Link>
      {authenticated ? (
        <nav className="authenticated-nav">
          <Link to="/catalog">Explorar Juegos</Link>
          {user?.role === 'CREATOR' && <Link to="/create-game">Publicar Juego</Link>}
          {user?.role === 'CREATOR' && <Link to="/create-form">Crear Formulario</Link>}
          {user?.role === 'CREATOR' && <Link to="/catalog">Mis métricas</Link>}
          <span className="user-badge">
            {user?.username || 'Usuario'} <strong>{user?.role || 'TESTER'}</strong>
          </span>
          <button type="button" className="nav-logout" onClick={logout}>Cerrar Sesión</button>
        </nav>
      ) : (
        <nav>
          <Link to="/login">Ingresar</Link>
          <Link to="/register">Registrarse</Link>
        </nav>
      )}
    </header>
  )
}
