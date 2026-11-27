import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'
import UpdateGameVersionModal from '../components/UpdateGameVersionModal'
import ConfirmStatusModal from '../components/ConfirmStatusModal'
import GameCover from '../components/GameCover'
import GameDetailModal from '../components/GameDetailModal'
import { useToast } from '../contexts/ToastContext'
import { downloadGame, getGames, updateGameStatus } from '../services/GameService'
import { validateOfficialUrl } from '../services/validation'
import '../styles/CatalogPage.css'

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

function formatVersion(version) {
  const value = version || '1.0'
  return value.toLowerCase().startsWith('v') ? value : `v${value}`
}

export default function CatalogPage() {
  const [games, setGames] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState('')
  const [status, setStatus] = useState('')
  const [updatingGame, setUpdatingGame] = useState(null)
  const [statusUpdatingId, setStatusUpdatingId] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [finalizingGame, setFinalizingGame] = useState(null)
  const [officialUrlDraft, setOfficialUrlDraft] = useState('')
  const user = getCurrentUser()
  const navigate = useNavigate()
  const notify = useToast()

  useEffect(() => {
    let active = true
    setLoading(true)
    getGames({ search, platform, status })
      .then((data) => {
        if (active) {
          setGames(user?.role === 'CREATOR'
            ? data.filter((game) => game.creatorUsername === user.username)
            : data)
        }
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

  }, [search, platform, status])

  async function handleStatusChange(game, status, officialUrl) {
    setError('')
    setStatusUpdatingId(game.id)
    try {
      const updatedGame = await updateGameStatus(game.id, status, officialUrl)
      setGames((current) => current.map((item) => item.id === updatedGame.id ? updatedGame : item))
      notify(`Estado de ${game.title}: ${statusLabels[status] || status}.`)
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setStatusUpdatingId(null)
    }
  }

  function handleStatusSelection(game, nextStatus) {
    if (nextStatus === 'FINALIZADO') {
      setError('')
      setOfficialUrlDraft(game.officialUrl || '')
      setFinalizingGame(game)
      return
    }
    handleStatusChange(game, nextStatus)
  }

  async function confirmFinalization(event) {
    event.preventDefault()
    const urlError = validateOfficialUrl(officialUrlDraft)
    if (urlError) {
      setError(urlError)
      return
    }
    if (await handleStatusChange(finalizingGame, 'FINALIZADO', officialUrlDraft)) {
      setFinalizingGame(null)
      setOfficialUrlDraft('')
    }
  }

  async function handleDownload(game) {
    if (game.status !== 'EN_PLAYTESTING' && !(user?.role === 'CREATOR' && user.username === game.creatorUsername)) {
      return
    }
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
      notify(`Descarga de ${game.title} iniciada.`)
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
        <div className="filter-group">
          <label htmlFor="game-search">Buscar por título o descripción</label>
          <input id="game-search" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar prototipos..." />
        </div>
        <div className="filter-group">
          <label htmlFor="platform-filter">Plataforma</label>
          <select id="platform-filter" value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="">Todas las plataformas</option>
            <option value="PC">PC</option>
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
            <option value="PLAYSTATION">PlayStation</option>
            <option value="XBOX">Xbox</option>
            <option value="NINTENDO_SWITCH">Nintendo Switch</option>
            <option value="WEB">Web / Navegador</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Estado del playtesting</label>
          <select id="status-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Todos los estados</option>
            <option value="EN_PLAYTESTING">En Playtesting</option>
            <option value="PAUSADO">Pausado</option>
            <option value="FINALIZADO">Finalizado</option>
          </select>
        </div>
      </section>
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="status-message">Cargando juegos...</p>}
      {!loading && !error && games.length === 0 && (
        <p className="status-message">Todavía no hay prototipos publicados.</p>
      )}
      <section className="game-grid">
        {games.map((game) => (
          <article className="game-card" key={game.id}>
            <GameCover game={game} />
            <div className="game-card-header">
              <span className="platform-tag">{platformLabels[game.platform] || game.platform}</span>
              <span className="game-genre">{game.genre || 'Sin género'}</span>
            </div>
            <span className={`status-badge status-${(game.status || 'EN_PLAYTESTING').toLowerCase()}`}>
              {statusLabels[game.status] || 'En Playtesting'}
            </span>
            <h2><button type="button" className="game-title-button" onClick={() => setSelectedGame(game)}>{game.title}</button></h2>
            <button type="button" className="game-details-link" onClick={() => setSelectedGame(game)}>Ver detalles</button>
            <p>{game.description || 'Este prototipo todavía no tiene descripción.'}</p>
            <dl className="game-details">
              <div><dt>Creado por</dt><dd>{game.creatorUsername}</dd></div>
              <div><dt>Plataforma</dt><dd>{platformLabels[game.platform] || game.platform}</dd></div>
              <div><dt>Versión</dt><dd>{game.version || '1.0'}</dd></div>
              {!(game.status === 'FINALIZADO' && game.officialUrl) && (
                <div>
                  <dt>Archivo</dt>
                  <dd className="file-metadata">{game.fileExtension || 'N/D'} • {game.fileSizeFormatted || 'N/D'}</dd>
                </div>
              )}
            </dl>
            {game.status === 'FINALIZADO' && game.officialUrl ? (
              <a className="button primary full-width" href={game.officialUrl} target="_blank" rel="noopener noreferrer">
                Ver Lanzamiento Oficial ↗
              </a>
            ) : (
              <button
                type="button"
                className="button primary full-width"
                onClick={() => handleDownload(game)}
                disabled={
                  downloadingId === game.id
                  || (game.status !== 'EN_PLAYTESTING'
                    && !(user?.role === 'CREATOR' && user.username === game.creatorUsername))
                }
              >
                {downloadingId === game.id
                  ? 'Descargando...'
                  : game.status === 'FINALIZADO'
                    ? 'Playtesting Finalizado - Prototipo publicado oficialmente'
                    : 'Descargar Prototipo'}
              </button>
            )}
            {user?.role === 'TESTER' && (
              <button
                type="button"
                className={`button secondary full-width${game.alreadyEvaluatedCurrentVersion ? ' evaluated-version-button' : ''}`}
                disabled={game.status !== 'EN_PLAYTESTING' || game.alreadyEvaluatedCurrentVersion}
                onClick={() => navigate(`/games/${game.id}/form`)}
              >
                {game.alreadyEvaluatedCurrentVersion
                  ? `Versión ${formatVersion(game.version)} Evaluada ✓`
                  : `Evaluar ${formatVersion(game.version)}`}
              </button>
            )}
            {user?.role === 'CREATOR' && user.username === game.creatorUsername && (
              <>
                <label className="status-control">
                  Estado del playtesting
                  <select
                    value={game.status || 'EN_PLAYTESTING'}
                    disabled={statusUpdatingId === game.id}
                    onChange={(event) => handleStatusSelection(game, event.target.value)}
                  >
                    <option value="EN_PLAYTESTING">En Playtesting</option>
                    <option value="PAUSADO">Pausado</option>
                    <option value="FINALIZADO">Finalizado</option>
                  </select>
                </label>
                {game.status === 'FINALIZADO' && (
                  <button
                    type="button"
                    className="button secondary full-width"
                    onClick={() => handleStatusSelection(game, 'FINALIZADO')}
                  >
                    {game.officialUrl ? 'Editar enlace oficial' : 'Agregar enlace oficial'}
                  </button>
                )}
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
            notify(`Versión de ${updatedGame.title} actualizada a ${updatedGame.version}.`)
          }}
        />
      )}
      {finalizingGame && (
        <ConfirmStatusModal
          game={finalizingGame}
          officialUrl={officialUrlDraft}
          error={error}
          submitting={statusUpdatingId === finalizingGame.id}
          isEditing={finalizingGame.status === 'FINALIZADO'}
          onOfficialUrlChange={setOfficialUrlDraft}
          onConfirm={confirmFinalization}
          onClose={() => {
            if (statusUpdatingId !== finalizingGame.id) {
              setFinalizingGame(null)
              setError('')
            }
          }}
        />
      )}
      {selectedGame && (
        <GameDetailModal
          game={games.find((game) => game.id === selectedGame.id) || selectedGame}
          isOwner={user?.role === 'CREATOR' && user.username === selectedGame.creatorUsername}
          isTester={user?.role === 'TESTER'}
          downloading={downloadingId === selectedGame.id}
          onDownload={() => handleDownload(selectedGame)}
          onEvaluate={() => {
            setSelectedGame(null)
            navigate(`/games/${selectedGame.id}/form`)
          }}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </main>
  )
}
