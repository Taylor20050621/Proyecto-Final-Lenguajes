import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyProfile } from '../services/AuthService'
import { getGameCoverUrl, getGames } from '../services/GameService'
import '../styles/TesterHistory.css'

const platformLabels = {
  PC: 'PC',
  ANDROID: 'Android',
  IOS: 'iOS',
  PLAYSTATION: 'PlayStation',
  XBOX: 'Xbox',
  NINTENDO_SWITCH: 'Nintendo Switch',
  WEB: 'Web',
  WEBGL: 'Web',
  PRINT_AND_PLAY: 'Print & Play',
}

function formatVersion(version) {
  if (!version) return 'Versión no disponible'
  return `v${String(version).replace(/^v/i, '')}`
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function HistoryCover({ game, title }) {
  const [unavailable, setUnavailable] = useState(false)
  const hasCover = game?.hasCoverImage && game.id != null && !unavailable

  return (
    <div className="tester-history-cover">
      {hasCover ? (
        <img src={getGameCoverUrl(game.id)} alt={`Portada de ${title}`} onError={() => setUnavailable(true)} />
      ) : (
        <span className="tester-history-cover-placeholder" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="7" y="10" width="34" height="27" rx="3" />
            <path d="M17 42h14M24 37v5M15 22h7m-3.5-3.5v7M29 21h.01M34 25h.01" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </div>
  )
}

export default function TesterHistoryPage() {
  const [activities, setActivities] = useState([])
  const [gamesById, setGamesById] = useState({})
  const [selectedGameId, setSelectedGameId] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([getMyProfile(), getGames()])
      .then(([profile, games]) => {
        if (!active) return
        if (profile.role !== 'TESTER') {
          setError('El historial de evaluaciones solo está disponible para testers.')
          return
        }
        setActivities((profile.activity || []).filter((item) => item.type === 'FEEDBACK'))
        setGamesById(Object.fromEntries(games.map((game) => [String(game.id), game])))
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const historyGames = useMemo(() => {
    const uniqueGames = new Map()
    activities.forEach((item) => {
      if (item.gameId == null) return
      const key = String(item.gameId)
      if (!uniqueGames.has(key)) {
        uniqueGames.set(key, {
          id: key,
          title: item.gameTitle || gamesById[key]?.title || 'Juego',
        })
      }
    })
    return [...uniqueGames.values()]
  }, [activities, gamesById])

  const filteredActivities = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return activities.filter((item) => {
      const matchesGame = !selectedGameId || String(item.gameId) === selectedGameId
      const matchesSearch = !normalizedSearch
        || `${item.title || ''} ${item.evaluatedVersion || ''}`.toLocaleLowerCase().includes(normalizedSearch)
      return matchesGame && matchesSearch
    })
  }, [activities, search, selectedGameId])

  const gameBreakdown = useMemo(() => {
    const counts = new Map()
    filteredActivities.forEach((item) => {
      const id = item.gameId == null ? 'unknown' : String(item.gameId)
      const current = counts.get(id) || {
        id,
        title: item.gameTitle || gamesById[id]?.title || 'Juego no disponible',
        count: 0,
      }
      current.count += 1
      counts.set(id, current)
    })
    return [...counts.values()].sort((first, second) => second.count - first.count || first.title.localeCompare(second.title))
  }, [filteredActivities, gamesById])

  const maxGameCount = Math.max(1, ...gameBreakdown.map((game) => game.count))

  return (
    <main className="content-shell tester-history-page">
      <header className="tester-history-header">
        <div>
          <Link className="tester-history-back" to="/profile">← Volver a Mi Perfil</Link>
          <span className="eyebrow">TU TRAYECTORIA DE PLAYTEST</span>
          <h1>Historial de Evaluaciones</h1>
          <p>Revisa tus sesiones y explora los prototipos que has probado.</p>
        </div>
        <div className="tester-history-total">
          <strong>{activities.length}</strong>
          <span>evaluaciones</span>
        </div>
      </header>

      <div className="tester-history-layout">
        <section className="tester-history-main" aria-label="Lista de evaluaciones">
          <div className="tester-history-filters">
            <div className="tester-history-filter">
              <label htmlFor="history-game-filter">Filtrar por juego</label>
              <select id="history-game-filter" value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)}>
                <option value="">Todos los juegos</option>
                {historyGames.map((game) => <option value={game.id} key={game.id}>{game.title}</option>)}
              </select>
            </div>
            <div className="tester-history-filter">
              <label htmlFor="history-search">Buscar formulario o versión</label>
              <input
                id="history-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej. Playtest inicial, v1.2..."
              />
            </div>
          </div>

          {loading && <p className="status-message">Cargando tu historial...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && filteredActivities.length === 0 && (
            <p className="status-message">{activities.length ? 'No hay evaluaciones que coincidan con estos filtros.' : 'Todavía no has respondido formularios.'}</p>
          )}
          {!loading && !error && filteredActivities.length > 0 && (
            <div className="tester-history-list">
              {filteredActivities.map((item) => {
                const game = item.gameId == null ? null : gamesById[String(item.gameId)]
                const gameTitle = item.gameTitle || game?.title || 'Juego no disponible'
                const platform = item.platform || game?.platform
                return (
                  <article className="tester-history-card" key={`${item.type}-${item.id}`}>
                    <HistoryCover game={{ ...game, id: item.gameId, hasCoverImage: item.hasCoverImage || game?.hasCoverImage }} title={gameTitle} />
                    <div className="tester-history-card-content">
                      <div className="tester-history-game-line">
                        <h2>{gameTitle}</h2>
                        {platform && <span className="tester-history-platform">{platformLabels[platform] || platform}</span>}
                        <span className="tester-history-version">{formatVersion(item.evaluatedVersion)}</span>
                      </div>
                      <h3>{item.title || 'Formulario respondido'}</h3>
                      <div className="tester-history-card-meta">
                        <span>{formatDate(item.submittedAt)}</span>
                        {item.pointsEarned != null && <span className="tester-history-points">+{item.pointsEarned} pts</span>}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <aside className="tester-history-sidebar">
          <section className="history-summary-card">
            <span className="eyebrow">RESUMEN DEL FILTRO</span>
            <h2>{selectedGameId ? historyGames.find((game) => game.id === selectedGameId)?.title || 'Juego seleccionado' : 'Tu actividad'}</h2>
            <div className="history-summary-total">
              <strong>{filteredActivities.length}</strong>
              <span>{filteredActivities.length === 1 ? 'formulario respondido' : 'formularios respondidos'}</span>
            </div>
            <div className="history-game-breakdown">
              <h3>Juegos evaluados</h3>
              {gameBreakdown.length ? gameBreakdown.map((game) => (
                <button
                  type="button"
                  className={`history-game-breakdown-row${selectedGameId === game.id ? ' history-game-breakdown-active' : ''}`}
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id === 'unknown' ? '' : game.id)}
                  disabled={game.id === 'unknown'}
                >
                  <span className="history-breakdown-name">{game.title}</span>
                  <span className="history-breakdown-count">{game.count}</span>
                  <span className="history-breakdown-track"><span style={{ width: `${(game.count / maxGameCount) * 100}%` }} /></span>
                </button>
              )) : <p className="history-no-breakdown">No hay juegos para mostrar con este filtro.</p>}
            </div>
            <Link className="button primary full-width history-explore-button" to="/catalog">Explorar más prototipos <span aria-hidden="true">→</span></Link>
          </section>
          <div className="history-sidebar-note">
            <span aria-hidden="true">✦</span>
            Cada evaluación ayuda a los creadores a mejorar sus prototipos.
          </div>
        </aside>
      </div>
    </main>
  )
}
