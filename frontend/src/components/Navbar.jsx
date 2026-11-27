import { Link, useLocation } from 'react-router-dom'
import { getCurrentUser, getMyNotifications, getMyProfile, getUnreadNotifications, isAuthenticated, logout } from '../services/AuthService'
import { useEffect, useState } from 'react'
import '../styles/Navbar.css'

export default function Navbar() {
  const location = useLocation()
  const authenticated = isAuthenticated()
  const [user, setUser] = useState(getCurrentUser())
  const [notifications, setNotifications] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const unreadNotifications = getUnreadNotifications(notifications)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function refreshUser() {
      getMyProfile().then(setUser).catch((error) => console.error(error))
    }
    function refreshNotifications() {
      getMyNotifications().then(setNotifications).catch((error) => console.error(error))
    }
    function handleNotificationsRead() {
      setNotifications((current) => [...current])
      refreshNotifications()
    }
    if (authenticated) {
      refreshUser()
      refreshNotifications()
      window.addEventListener('user-profile-updated', refreshUser)
      window.addEventListener('user-profile-updated', refreshNotifications)
      window.addEventListener('notifications-read', handleNotificationsRead)
    }
    return () => {
      window.removeEventListener('user-profile-updated', refreshUser)
      window.removeEventListener('user-profile-updated', refreshNotifications)
      window.removeEventListener('notifications-read', handleNotificationsRead)
    }
  }, [authenticated, location.pathname])

  return (
    <header className="topbar">
      <div className="navbar-inner">
        <Link className="brand" to="/">Playtesting<span>.</span></Link>
        <div className="navbar-mobile-controls">
          {authenticated && (
            <span className="user-badge mobile-user-badge">
              {user?.username || 'Usuario'} {user?.role === 'TESTER' && <strong>{user?.points ?? 0} pts</strong>} <strong>{user?.role || 'TESTER'}</strong>
            </span>
          )}
          <button
            type="button"
            className={`mobile-nav-toggle${menuOpen ? ' is-open' : ''}`}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        {authenticated ? (
          <nav id="primary-navigation" className={`authenticated-nav${menuOpen ? ' nav-open' : ''}`} aria-label="Navegación principal">
            <Link to="/catalog" onClick={() => setMenuOpen(false)}>{user?.role === 'CREATOR' ? 'Mis Juegos' : 'Explorar Juegos'}</Link>
            {user?.role === 'CREATOR' && <Link to="/create-game" onClick={() => setMenuOpen(false)}>Publicar Juego</Link>}
            {user?.role === 'CREATOR' && <Link to="/create-form" onClick={() => setMenuOpen(false)}>Crear Formulario</Link>}
            {user?.role === 'CREATOR' && <Link to="/creator/metrics" onClick={() => setMenuOpen(false)}>Mis métricas</Link>}
            <Link to="/leaderboard" onClick={() => setMenuOpen(false)}>Ranking Testers</Link>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>Mi Perfil</Link>
            {user?.role === 'TESTER' && (
              <Link className="notification-badge" to="/profile" onClick={() => setMenuOpen(false)}>
                Avisos{unreadNotifications.length > 0 ? ` ${unreadNotifications.length}` : ''}
              </Link>
            )}
            <span className="user-badge">
              {user?.username || 'Usuario'} {user?.role === 'TESTER' && <strong>{user?.points ?? 0} pts</strong>} <strong>{user?.role || 'TESTER'}</strong>
            </span>
            <button type="button" className="nav-logout" onClick={logout}>Cerrar Sesión</button>
          </nav>
        ) : (
          <div id="primary-navigation" className={`public-nav${menuOpen ? ' public-nav-open' : ''}`}>
            <nav className="public-links" aria-label="Navegación principal">
              <a href="/#como-funciona" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
              <a href="/#creadores" onClick={() => setMenuOpen(false)}>Para Creadores</a>
              <a href="/#testers" onClick={() => setMenuOpen(false)}>Para Testers</a>
              <a href="/#acerca-de" onClick={() => setMenuOpen(false)}>Acerca de</a>
              <a href="/#privacidad" onClick={() => setMenuOpen(false)}>Privacidad</a>
            </nav>
            <nav className="public-actions" aria-label="Acceso a la cuenta">
              <Link to="/login" onClick={() => setMenuOpen(false)}>Ingresar</Link>
              <Link className="button primary" to="/register" onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
