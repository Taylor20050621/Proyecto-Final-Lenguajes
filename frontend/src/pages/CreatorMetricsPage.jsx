import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'
import { getGames } from '../services/GameService'
import { getFeedbackSummary } from '../services/FormService'
import GameCover from '../components/GameCover'
import '../styles/CatalogPage.css'
import '../styles/CreatorMetrics.css'

const statusLabels = {
  EN_PLAYTESTING: 'En Playtesting',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
}

function averageLabel(value) {
  return value == null ? '—' : `${Number(value).toFixed(2)} / 5`
}

export default function CreatorMetricsPage() {
  const [games, setGames] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const user = getCurrentUser()

  useEffect(() => {
    let active = true
    async function loadMetrics() {
      try {
        const allGames = await getGames()
        const creatorGames = allGames.filter((game) => game.creatorUsername === user?.username)
        const metrics = await Promise.all(creatorGames.map(async (game) => ({
          ...game,
          feedbackSummary: await getFeedbackSummary(game.id),
        })))
        if (active) setGames(metrics)
      } catch (requestError) {
        if (active) setError(requestError.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadMetrics()
    return () => {
      active = false
    }
  }, [user?.username])

  if (loading) {
    return <main className="content-shell"><p className="status-message">Cargando métricas de tus prototipos...</p></main>
  }
  if (error) {
    return <main className="content-shell"><p className="error-message">{error}</p></main>
  }

  const evaluationCount = games.reduce((total, game) => total + game.feedbackSummary.totalResponses, 0)
  const ratedGames = games.filter((game) => game.feedbackSummary.averageLikertScore != null)
  const likertAnswerCount = ratedGames.reduce(
    (total, game) => total + (game.feedbackSummary.likertAnswerCount ?? game.feedbackSummary.totalResponses),
    0,
  )
  const globalAverage = likertAnswerCount
    ? ratedGames.reduce(
      (total, game) => total + Number(game.feedbackSummary.averageLikertScore)
        * (game.feedbackSummary.likertAnswerCount ?? game.feedbackSummary.totalResponses),
      0,
    ) / likertAnswerCount
    : null

  return (
    <main className="content-shell creator-metrics-page">
      <section className="page-heading">
        <span className="eyebrow">MÉTRICAS DEL ESTUDIO</span>
        <h1>Rendimiento de tus juegos</h1>
        <p>Una vista comparativa de los prototipos publicados y el feedback de tus playtesters.</p>
      </section>
      <section className="creator-metrics-kpis">
        <article className="creator-metric-card">
          <span>Total de prototipos publicados</span>
          <strong>{games.length}</strong>
        </article>
        <article className="creator-metric-card">
          <span>Total de evaluaciones recibidas</span>
          <strong>{evaluationCount}</strong>
        </article>
        <article className="creator-metric-card">
          <span>Promedio global de satisfacción</span>
          <strong>{averageLabel(globalAverage)}</strong>
        </article>
      </section>
      <section className="creator-metrics-section">
        <h2>Comparativa de prototipos</h2>
        {games.length === 0 ? (
          <p className="status-message">Aún no has publicado prototipos.</p>
        ) : (
          <div className="creator-metrics-table-wrap">
            <table className="creator-metrics-table">
              <thead>
                <tr>
                  <th>Juego</th>
                  <th>Versión</th>
                  <th>Estado</th>
                  <th>Evaluaciones</th>
                  <th>Promedio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => {
                  const score = game.feedbackSummary.averageLikertScore
                  const progress = score == null ? 0 : Math.min(100, (Number(score) / 5) * 100)
                  return (
                    <tr key={game.id}>
                      <td>
                        <div className="creator-metric-game">
                          <GameCover game={game} />
                          <strong>{game.title}</strong>
                        </div>
                      </td>
                      <td>{game.version || '1.0'}</td>
                      <td>{statusLabels[game.status] || game.status}</td>
                      <td>{game.feedbackSummary.totalResponses}</td>
                      <td>
                        <div className="creator-metric-rating">
                          <span>{averageLabel(score)}</span>
                          <div className="metric-bar" aria-label={`${progress}%`}>
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </td>
                      <td><Link className="button secondary" to={`/dashboard/${game.id}`}>Analizar Juego</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
