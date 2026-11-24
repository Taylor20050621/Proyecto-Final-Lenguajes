import { useEffect, useState } from 'react'
import { getMyNotifications, getMyProfile, markNotificationsAsRead } from '../services/AuthService'
import '../styles/ProfilePage.css'

function getLevel(points) {
  if (points >= 500) return 'Leyenda Indie'
  if (points >= 150) return 'Tester Frecuente'
  return 'Novato'
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    Promise.all([getMyProfile(), getMyNotifications()])
      .then(([profileData, notificationData]) => {
        setProfile(profileData)
        setNotifications(notificationData)
        if (profileData.role === 'TESTER') {
          markNotificationsAsRead(notificationData)
          window.dispatchEvent(new Event('notifications-read'))
        }
      })
      .catch((requestError) => setError(requestError.message))
  }, [])

  if (error) return <main className="content-shell"><p className="error-message">{error}</p></main>
  if (!profile) return <main className="content-shell"><p className="status-message">Cargando perfil...</p></main>

  const isCreator = profile.role === 'CREATOR'
  return (
    <main className="content-shell">
      <section className="page-heading">
        <span className="eyebrow">MI PERFIL</span>
        <h1>{profile.username}</h1>
        <p>{profile.email} · {profile.role === 'CREATOR' ? 'Creador' : 'Tester'}</p>
      </section>
      <section className="profile-summary">
        {isCreator ? (
          <>
            <article className="kpi-card"><span>Juegos publicados</span><strong>{profile.gamesPublished}</strong></article>
            <article className="kpi-card"><span>Evaluaciones recibidas</span><strong>{profile.evaluationsReceived}</strong></article>
            <article className="kpi-card"><span>Valoración promedio</span><strong>{profile.averageRating ?? '—'}</strong></article>
          </>
        ) : (
          <>
            <article className="kpi-card"><span>Puntos acumulados</span><strong>{profile.points}</strong></article>
            <article className="kpi-card"><span>Nivel</span><strong>{getLevel(profile.points)}</strong></article>
            <article className="kpi-card"><span>Feedbacks enviados</span><strong>{profile.feedbacksSubmitted}</strong></article>
          </>
        )}
      </section>
      <section className="dashboard-section">
        {profile.role === 'TESTER' && (
          <>
            <h2>Avisos de versión</h2>
            {notifications.length === 0 ? (
              <p className="status-message">No tienes actualizaciones pendientes.</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li key={notification.gameId}>
                    <strong>{notification.gameTitle}</strong>
                    <span> Nueva versión {notification.version} disponible.</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <h2>{isCreator ? 'Juegos creados' : 'Formularios respondidos'}</h2>
        {profile.activity.length === 0 ? (
          <p className="status-message">Todavía no hay actividad para mostrar.</p>
        ) : (
          <ul className="activity-list">
            {profile.activity.map((item) => <li key={`${item.type}-${item.id}`}>{item.title}</li>)}
          </ul>
        )}
      </section>
    </main>
  )
}
