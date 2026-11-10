import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'
import UpdateGameVersionModal from '../components/UpdateGameVersionModal'
import { downloadGame, getGames } from '../services/GameService'

const platformLabels = {
  PC: 'PC',
  WEBGL: 'WebGL',
  PRINT_AND_PLAY: 'Print & Play',
}

export default function CatalogPage() {
  const [games, setGames] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('')
  const [updatingGame, setUpdatingGame] = useState(null)
  const user = getCurrentUser()

  useEffect(() => {
    let active = true
    setLoading(true)
    getGames({ search, platform })
      .then((data) => {
        if (active) setGames(data)
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
  }, [search, platform])

  async function handleDownload(game) {
    setError('')
    setDownloadingId(game.id)
    try {
      const { blob, filename } = await downloadGame(game.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <main className="content-shell">
      <section className="page-heading">
        <span className="eyebrow">CATÁLOGO DE PROTOTIPOS</span>
        <h1>Explorar juegos</h1>
        <p>Descubre nuevas ideas indie y descarga prototipos para probarlos.</p>
      </section>
      <section className="catalog-filters" aria-label="Filtros del catálogo">
        <label htmlFor="game-search">Buscar por título o descripción</label>
        <input id="game-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prototipos..." />
        <label htmlFor="platform-filter">Plataforma</label>
        <select id="platform-filter" value={platform} onChange={(event) => setPlatform(event.target.value)}>
          <option value="">Todas las plataformas</option>
          <option value="PC">PC</option>
          <option value="WEBGL">WebGL</option>
          <option value="PRINT_AND_PLAY">Print &amp; Play</option>
        </select>
      </section>
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="status-message">Cargando juegos...</p>}
      {!loading && !error && games.length === 0 && (
        <p className="status-message">Todavía no hay prototipos publicados.</p>
      )}
      <section className="game-grid">
        {games.map((game) => (
          <article className="game-card" key={game.id}>
            <div className="game-card-header">
              <span className="platform-tag">{platformLabels[game.platform] || game.platform}</span>
              <span className="game-genre">{game.genre || 'Sin género'}</span>
            </div>
            <h2>{game.title}</h2>
            <p>{game.description || 'Este prototipo todavía no tiene descripción.'}</p>
            <dl className="game-details">
              <div><dt>Creado por</dt><dd>{game.creatorUsername}</dd></div>
              <div><dt>Plataforma</dt><dd>{platformLabels[game.platform] || game.platform}</dd></div>
              <div><dt>Versión</dt><dd>{game.version || '1.0'}</dd></div>
            </dl>
            <button
              type="button"
              className="button primary full-width"
              onClick={() => handleDownload(game)}
              disabled={downloadingId === game.id}
            >
              {downloadingId === game.id ? 'Descargando...' : 'Descargar Prototipo'}
            </button>
            {user?.role === 'TESTER' && (
              <Link className="button secondary full-width" to={`/games/${game.id}/form`}>
                Evaluar Juego
              </Link>
            )}
            {user?.role === 'CREATOR' && user.username === game.creatorUsername && (
              <>
                <Link className="button secondary full-width" to={`/dashboard/${game.id}`}>Ver Dashboard de Métricas</Link>
                <button type="button" className="button secondary full-width" onClick={() => setUpdatingGame(game)}>Actualizar versión</button>
              </>
            )}
          </article>
        ))}
      </section>
      {updatingGame && (
        <UpdateGameVersionModal
          game={updatingGame}
          onClose={() => setUpdatingGame(null)}
          onUpdated={(updatedGame) => {
            setGames((current) => current.map((game) => game.id === updatedGame.id ? updatedGame : game))
            setUpdatingGame(null)
          }}
        />
      )}
    </main>
  )
}
