import { Link, useLocation } from 'react-router-dom'
import { getCurrentUser, getMyNotifications, getMyProfile, getUnreadNotifications, isAuthenticated, logout } from '../services/AuthService'
import { useEffect, useState } from 'react'
import '../styles/Navbar.css'

export default function Navbar() {
  useLocation()
  const authenticated = isAuthenticated()
  const location = useLocation()
  const [user, setUser] = useState(getCurrentUser())
  const [notifications, setNotifications] = useState([])
  const unreadNotifications = getUnreadNotifications(notifications)

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
      <Link className="brand" to="/">Playtesting<span>.</span></Link>
      {authenticated ? (
        <nav className="authenticated-nav">
          <Link to="/catalog">{user?.role === 'CREATOR' ? 'Mis Juegos' : 'Explorar Juegos'}</Link>
          {user?.role === 'CREATOR' && <Link to="/create-game">Publicar Juego</Link>}
          {user?.role === 'CREATOR' && <Link to="/create-form">Crear Formulario</Link>}
          {user?.role === 'CREATOR' && <Link to="/catalog">Mis métricas</Link>}
          <Link to="/profile">Mi Perfil</Link>
          {user?.role === 'TESTER' && (
            <Link className="notification-badge" to="/profile">
              Avisos{unreadNotifications.length > 0 ? ` ${unreadNotifications.length}` : ''}
            </Link>
          )}
          <span className="user-badge">
            {user?.username || 'Usuario'} {user?.role === 'TESTER' && <strong>{user?.points ?? 0} pts</strong>} <strong>{user?.role || 'TESTER'}</strong>
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
