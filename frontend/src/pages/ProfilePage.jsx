import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyNotifications, getMyProfile, markNotificationsAsRead } from '../services/AuthService'
import { getGameCoverUrl, getGames } from '../services/GameService'
import { getFeedbackSummary } from '../services/FormService'
import '../styles/ProfilePage.css'

const platformLabels = {
  PC: 'PC',
  ANDROID: 'Android',
  IOS: 'iOS',
  PLAYSTATION: 'PlayStation',
  XBOX: 'Xbox',
  NINTENDO_SWITCH: 'Nintendo Switch',
  WEB: 'Web / Navegador',
  WEBGL: 'Web / Navegador',
  PRINT_AND_PLAY: 'Print & Play',
}

const statusLabels = {
  EN_PLAYTESTING: 'En Playtesting',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
}

const kpiIcons = {
  games: <><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z" /><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21" /></>,
  feedback: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.8A2.5 2.5 0 0 1 4 13.5z" /><path d="M8 8h8M8 11.5h5" /></>,
  rating: <><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></>,
  points: <><path d="m12 3 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" /><path d="m9 17-1 4 4-2 4 2-1-4" /></>,
  level: <><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6z" /><path d="m9 12 2 2 4-4" /></>,
}

function KpiIcon({ name }) {
  return (
    <span className="profile-kpi-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {kpiIcons[name]}
      </svg>
    </span>
  )
}

function getTesterLevel(points) {
  if (points >= 300) return 'Leyenda Indie'
  if (points >= 100) return 'Tester Frecuente'
  return 'Novato'
}

function getCreatorLevel(gameCount) {
  if (gameCount >= 4) return 'Estudio Indie Consolidado'
  if (gameCount >= 2) return 'Desarrollador Activo'
  return 'Estudio Emergente'
}

function getInitials(username) {
  return (username || '?').trim().charAt(0).toUpperCase()
}

function formatVersion(version) {
  const value = version || '1.0'
  return value.toLowerCase().startsWith('v') ? value : `v${value}`
}

function averageLabel(value) {
  return value == null ? '—' : `${Number(value).toFixed(2)} / 5`
}

function isVersionAboveOne(version) {
  const parts = String(version || '1.0').replace(/^v/i, '').split('.').map((part) => Number.parseInt(part, 10) || 0)
  const [major = 0, minor = 0, patch = 0] = parts
  return major > 1 || (major === 1 && (minor > 0 || patch > 0))
}

function getFeedbackComments(games) {
  return games.flatMap((game) => (game.feedbackSummary?.questionSummaries || []).flatMap((question) => (
    (question.comments || []).map((comment) => ({
      gameId: game.id,
      gameTitle: game.title,
      version: game.version || '1.0',
      question: question.questionText,
      text: typeof comment === 'string' ? comment : comment?.text || comment?.comment || '',
    }))
  ))).filter((item) => item.text.trim()).slice(0, 8)
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState([])
  const [creatorGames, setCreatorGames] = useState([])
  const [creatorLoading, setCreatorLoading] = useState(false)
  const [creatorError, setCreatorError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function loadProfile() {
      try {
        const [profileData, notificationData] = await Promise.all([getMyProfile(), getMyNotifications()])
        if (!active) return
        setProfile(profileData)
        setNotifications(notificationData)
        if (profileData.role === 'TESTER') {
          markNotificationsAsRead(notificationData)
          window.dispatchEvent(new Event('notifications-read'))
        }

        if (profileData.role === 'CREATOR') {
          setCreatorLoading(true)
          try {
            const allGames = await getGames()
            const ownedGames = allGames.filter((game) => game.creatorUsername === profileData.username)
            const summaries = await Promise.allSettled(ownedGames.map((game) => getFeedbackSummary(game.id)))
            if (!active) return
            setCreatorGames(ownedGames.map((game, index) => ({
              ...game,
              feedbackSummary: summaries[index].status === 'fulfilled' ? summaries[index].value : null,
            })))
            const failures = summaries.filter((summary) => summary.status === 'rejected').length
            if (failures) {
              setCreatorError(`No se pudieron cargar las métricas de ${failures} juego(s).`)
            }
          } catch (requestError) {
            if (active) setCreatorError(requestError.message)
          } finally {
            if (active) setCreatorLoading(false)
          }
        }
      } catch (requestError) {
        if (active) setError(requestError.message)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [])

  const isCreator = profile?.role === 'CREATOR'
  const platformsTested = profile?.platformsTested || []
  const feedbackCount = profile?.feedbacksSubmitted || 0
  const points = profile?.points || 0

  const creatorMetrics = useMemo(() => {
    const evaluationCount = creatorGames.reduce(
      (total, game) => total + (game.feedbackSummary?.totalResponses || 0),
      0,
    )
    const ratedGames = creatorGames.filter((game) => game.feedbackSummary?.averageLikertScore != null)
    const ratingCount = ratedGames.reduce(
      (total, game) => total + (game.feedbackSummary.likertAnswerCount ?? game.feedbackSummary.totalResponses ?? 0),
      0,
    )
    const average = ratingCount
      ? ratedGames.reduce((total, game) => total
        + Number(game.feedbackSummary.averageLikertScore)
          * (game.feedbackSummary.likertAnswerCount ?? game.feedbackSummary.totalResponses ?? 0), 0) / ratingCount
      : null
    return {
      evaluationCount: creatorGames.some((game) => game.feedbackSummary)
        ? evaluationCount
        : (profile?.evaluationsReceived || 0),
      average: average ?? profile?.averageRating ?? null,
      activeCount: creatorGames.filter((game) => game.status === 'EN_PLAYTESTING').length,
      finalizedCount: creatorGames.filter((game) => game.status === 'FINALIZADO').length,
    }
  }, [creatorGames, profile])

  if (error) return <main className="content-shell"><p className="error-message">{error}</p></main>
  if (!profile) return <main className="content-shell"><p className="status-message">Cargando perfil...</p></main>

  const testerLevel = getTesterLevel(points)
  const creatorLevel = getCreatorLevel(creatorGames.length)
  const testerProgress = points >= 300
    ? 100
    : points >= 100
      ? ((points - 100) / 200) * 100
      : (points / 100) * 100
  const creatorAchievements = [
    {
      title: 'Primer Lanzamiento',
      description: 'Publica al menos un prototipo.',
      unlocked: creatorGames.length >= 1,
      lockedHint: 'Publica tu primer prototipo.',
    },
    {
      title: 'Iteración Constante',
      description: 'Actualiza un juego a una versión superior a 1.0.',
      unlocked: creatorGames.some((game) => isVersionAboveOne(game.version)),
      lockedHint: 'Actualiza la versión de uno de tus juegos.',
    },
    {
      title: 'Aclamado por Testers',
      description: 'Mantén una valoración promedio de 4.5 o más.',
      unlocked: creatorMetrics.average != null && Number(creatorMetrics.average) >= 4.5,
      lockedHint: creatorMetrics.average == null
        ? 'Recibe calificaciones de tus testers.'
        : `Mejora tu promedio actual (${Number(creatorMetrics.average).toFixed(2)} / 5) hasta 4.5.`,
    },
    {
      title: 'Lanzamiento Comercial',
      description: 'Lleva al menos un juego al estado Finalizado.',
      unlocked: creatorGames.some((game) => game.status === 'FINALIZADO'),
      lockedHint: 'Finaliza uno de tus juegos.',
    },
  ]
  const testerAchievements = [
    {
      title: 'Primer Paso',
      description: 'Completa tu primera evaluación.',
      unlocked: feedbackCount >= 1,
      lockedHint: 'Te falta completar 1 evaluación.',
    },
    {
      title: 'Crítico Constante',
      description: 'Completa 3 o más evaluaciones.',
      unlocked: feedbackCount >= 3,
      lockedHint: `Te faltan ${Math.max(0, 3 - feedbackCount)} evaluaciones.`,
    },
    {
      title: 'Explorador Multiplataforma',
      description: 'Evalúa juegos en 2 o más plataformas distintas.',
      unlocked: platformsTested.length >= 2,
      lockedHint: `Prueba juegos en ${Math.max(0, 2 - platformsTested.length)} plataforma(s) más.`,
    },
    {
      title: 'Cazador Veterano',
      description: 'Alcanza 150 puntos.',
      unlocked: points >= 150,
      lockedHint: `Te faltan ${Math.max(0, 150 - points)} puntos.`,
    },
  ]
  const recentComments = getFeedbackComments(creatorGames)
  const creatorActivity = recentComments.length
    ? recentComments.map((comment, index) => (
      <li className="recent-feedback-card" key={`${comment.gameId}-${index}`}>
        <div className="recent-feedback-heading">
          <strong>{comment.gameTitle}</strong>
          <span>{formatVersion(comment.version)}</span>
        </div>
        {comment.question && <span className="recent-feedback-question">{comment.question}</span>}
        <p>{comment.text}</p>
      </li>
    ))
    : creatorGames.some((game) => game.feedbackSummary?.totalResponses > 0)
      ? <li className="recent-feedback-empty">Hay evaluaciones recibidas, pero aún no incluyen comentarios escritos.</li>
      : null

  return (
    <main className="content-shell profile-page">
      <section className="profile-hero" aria-label="Resumen del perfil">
        <div className="profile-avatar" aria-hidden="true">{getInitials(profile.username)}</div>
        <div className="profile-identity">
          <span className="eyebrow">MI PERFIL</span>
          <h1>{profile.username}</h1>
          <p className="profile-email">{profile.email}</p>
          <div className="profile-badges">
            <span className="profile-badge role-badge">{isCreator ? 'CREATOR' : 'TESTER'}</span>
            <span className="profile-badge level-badge">{isCreator ? creatorLevel : testerLevel}</span>
          </div>
        </div>
        <nav className="profile-quick-actions" aria-label="Acciones rápidas">
          {isCreator ? (
            <>
              <Link className="button primary profile-primary-action" to="/create-game">+ Publicar Prototipo</Link>
              <Link className="button secondary" to="/creator/metrics">Ver Métricas Globales</Link>
            </>
          ) : (
            <>
              <Link className="button primary profile-primary-action" to="/catalog">Explorar Catálogo</Link>
              <Link className="button secondary" to="/leaderboard">Ver Ranking</Link>
            </>
          )}
        </nav>
      </section>

      <section className="profile-summary" aria-label="Indicadores del perfil">
        {isCreator ? (
          <>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="games" /><span>Juegos publicados</span></div>
              <strong>{creatorGames.length || profile.gamesPublished || 0}</strong>
              <p>{creatorMetrics.activeCount} en playtesting • {creatorMetrics.finalizedCount} finalizados</p>
            </article>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="feedback" /><span>Evaluaciones recibidas</span></div>
              <strong>{creatorMetrics.evaluationCount}</strong>
              <p>Feedback recopilado de testers</p>
            </article>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="rating" /><span>Valoración promedio</span></div>
              <strong>{averageLabel(creatorMetrics.average)}</strong>
              <div className="profile-rating-stars" aria-label={`Valoración: ${averageLabel(creatorMetrics.average)}`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span className={creatorMetrics.average != null && index < Math.round(Number(creatorMetrics.average)) ? 'star-lit' : ''} key={index}>★</span>
                ))}
              </div>
            </article>
          </>
        ) : (
          <>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="points" /><span>Puntos acumulados</span></div>
              <strong>{points}</strong>
              <div className="profile-progress-track" role="progressbar" aria-label="Progreso al siguiente nivel" aria-valuenow={Math.round(testerProgress)} aria-valuemin="0" aria-valuemax="100">
                <span style={{ width: `${testerProgress}%` }} />
              </div>
              <p>{points >= 300 ? 'Nivel máximo alcanzado' : `${Math.max(0, (points >= 100 ? 300 : 100) - points)} puntos para el siguiente nivel`}</p>
            </article>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="level" /><span>Nivel</span></div>
              <strong className="profile-level-value">{testerLevel}</strong>
              <div className="profile-rating-stars profile-level-stars" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => <span className={index <= (points >= 300 ? 2 : points >= 100 ? 1 : 0) ? 'star-lit' : ''} key={index}>★</span>)}
              </div>
            </article>
            <article className="kpi-card">
              <div className="profile-kpi-top"><KpiIcon name="feedback" /><span>Juegos evaluados</span></div>
              <strong>{feedbackCount}</strong>
              <p>Formularios de playtesting respondidos</p>
            </article>
          </>
        )}
      </section>

      {isCreator ? (
        <>
          <section className="profile-section" aria-labelledby="created-games-title">
            <div className="profile-section-heading">
              <div><span className="eyebrow">EL ESTUDIO</span><h2 id="created-games-title">Juegos creados</h2></div>
              <span className="profile-section-count">{creatorGames.length} juegos</span>
            </div>
            {creatorLoading && <p className="status-message">Cargando prototipos y métricas...</p>}
            {creatorError && <p className="error-message">{creatorError}</p>}
            {!creatorLoading && creatorGames.length === 0 ? (
              <p className="status-message">Todavía no has publicado prototipos.</p>
            ) : (
              <div className="created-games-list">
                {creatorGames.map((game) => (
                  <article className="created-game-card" key={game.id}>
                    <div className="created-game-cover">
                      {game.hasCoverImage ? (
                        <img src={getGameCoverUrl(game.id)} alt={`Portada de ${game.title}`} />
                      ) : (
                        <span className="created-game-cover-placeholder" aria-hidden="true">
                          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="7" y="10" width="34" height="27" rx="3" />
                            <path d="M17 42h14M24 37v5M15 22h7m-3.5-3.5v7M29 21h.01M34 25h.01" strokeLinecap="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <div className="created-game-info">
                      <div className="created-game-title-row">
                        <h3>{game.title}</h3>
                        <span className="created-game-version">{formatVersion(game.version)}</span>
                      </div>
                      <div className="created-game-tags">
                        <span>{platformLabels[game.platform] || game.platform}</span>
                        <span className={`created-game-status status-${(game.status || '').toLowerCase()}`}>{statusLabels[game.status] || game.status}</span>
                      </div>
                    </div>
                    <div className="created-game-actions">
                      <span className="created-game-evaluations">{game.feedbackSummary?.totalResponses ?? '—'} evaluaciones</span>
                      <Link className="created-game-dashboard" to={`/dashboard/${game.id}`}>Ver Dashboard <span aria-hidden="true">→</span></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="achievement-section" aria-labelledby="achievement-title">
            <div className="profile-section-heading">
              <div><span className="eyebrow">HITOS DEL ESTUDIO</span><h2 id="achievement-title">Insignias del Creador</h2></div>
            </div>
            <div className="achievement-grid">
              {creatorAchievements.map((achievement) => (
                <article className={`achievement-card${achievement.unlocked ? ' achievement-unlocked' : ' achievement-locked'}`} key={achievement.title}>
                  <span className="achievement-mark" aria-hidden="true">{achievement.unlocked ? '★' : '◇'}</span>
                  <div>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    {!achievement.unlocked && <span className="achievement-status">Bloqueada · {achievement.lockedHint}</span>}
                    {achievement.unlocked && <span className="achievement-status achievement-status-unlocked">Desbloqueada</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="profile-section recent-activity-section" aria-labelledby="recent-activity-title">
            <div className="profile-section-heading">
              <div><span className="eyebrow">VOZ DE LA COMUNIDAD</span><h2 id="recent-activity-title">Actividad reciente</h2></div>
            </div>
            {creatorLoading ? <p className="status-message">Cargando feedback reciente...</p> : creatorActivity ? (
              <ul className="recent-feedback-list">{creatorActivity}</ul>
            ) : (
              <p className="status-message">Aún no hay comentarios o evaluaciones para mostrar.</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="dashboard-section profile-section">
            <h2>Avisos de versión</h2>
            {notifications.length === 0 ? (
              <p className="status-message">No tienes actualizaciones pendientes.</p>
            ) : (
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li key={notification.gameId}>
                    <strong>{notification.gameTitle}</strong>
                    <span> Nueva versión {notification.version} disponible.</span>
                    {notification.releaseNotes && <p className="release-notification-notes">{notification.releaseNotes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="achievement-section" aria-labelledby="achievement-title">
            <div className="profile-section-heading">
              <div><span className="eyebrow">TUS HITOS</span><h2 id="achievement-title">Insignias y Logros</h2></div>
            </div>
            <div className="achievement-grid">
              {testerAchievements.map((achievement) => (
                <article
                  className={`achievement-card${achievement.unlocked ? ' achievement-unlocked' : ' achievement-locked'}`}
                  key={achievement.title}
                  aria-label={`${achievement.title}: ${achievement.unlocked ? 'desbloqueada' : 'bloqueada'}`}
                >
                  <span className="achievement-mark" aria-hidden="true">{achievement.unlocked ? '★' : '◇'}</span>
                  <div>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    {!achievement.unlocked && <span className="achievement-status">Bloqueada · {achievement.lockedHint}</span>}
                    {achievement.title === 'Explorador Multiplataforma' && platformsTested.length > 0 && (
                      <p className="achievement-platforms">Probadas: {platformsTested.map((platform) => platformLabels[platform] || platform).join(', ')}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="profile-section recent-activity-section">
            <div className="profile-section-heading">
              <div><span className="eyebrow">TU HISTORIAL</span><h2>Formularios respondidos</h2></div>
              <div className="profile-history-actions">
                <span className="profile-section-count">{profile.activity?.length || 0} evaluaciones</span>
                {!!profile.activity?.length && (
                  <Link className="profile-history-link" to="/tester/history">
                    Ver todo el historial ({profile.activity.length}) <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </div>
            {!profile.activity?.length ? (
              <p className="status-message">Todavía no hay actividad para mostrar.</p>
            ) : (
              <ul className="activity-list">
                {profile.activity.slice(0, 5).map((item) => (
                  <li className="profile-history-row" key={`${item.type}-${item.id}`}>
                    <div className="profile-history-row-main">
                      <strong>{item.title}</strong>
                      <span className="history-game-badge">{item.gameTitle || 'Juego no disponible'}</span>
                      {item.evaluatedVersion && <span className="history-version-badge">v{item.evaluatedVersion.replace(/^v/i, '')}</span>}
                    </div>
                    <span className="profile-history-row-meta">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'Fecha no disponible'}
                      {item.pointsEarned != null && ` · +${item.pointsEarned} pts`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  )
}
