import { useEffect } from 'react'
import GameCover from './GameCover'
import '../styles/GameDetailModal.css'

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

export default function GameDetailModal({
  game,
  isOwner,
  isTester,
  downloading,
  onDownload,
  onEvaluate,
  onClose,
}) {
  const canDownload = game.status === 'EN_PLAYTESTING' || isOwner
  const canEvaluate = isTester && game.status === 'EN_PLAYTESTING' && !game.alreadyEvaluatedCurrentVersion

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card game-detail-modal" role="dialog" aria-modal="true" aria-labelledby="game-detail-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <GameCover game={game} detail />
        <div className="game-detail-content">
          <span className={`status-badge status-${(game.status || 'EN_PLAYTESTING').toLowerCase()}`}>
            {statusLabels[game.status] || 'En Playtesting'}
          </span>
          <h2 id="game-detail-title">{game.title}</h2>
          <p className="game-detail-description">{game.description || 'Este prototipo todavía no tiene descripción.'}</p>
          <dl className="game-detail-list">
            <div><dt>Creado por</dt><dd>{game.creatorUsername}</dd></div>
            <div><dt>Plataforma</dt><dd>{platformLabels[game.platform] || game.platform}</dd></div>
            <div><dt>Género</dt><dd>{game.genre || 'Sin género'}</dd></div>
            <div><dt>Versión vigente</dt><dd>{game.version || '1.0'}</dd></div>
            <div className="game-file-metadata"><dt>Archivo del prototipo</dt><dd>{game.fileExtension || 'N/D'} • {game.fileSizeFormatted || 'N/D'}</dd></div>
          </dl>
          <section className="release-notes">
            <h3>Notas de versión</h3>
            <p>{game.releaseNotes || 'Este espacio estará disponible para las notas de las próximas versiones.'}</p>
          </section>
          <div className="game-detail-actions">
            {game.status === 'FINALIZADO' && game.officialUrl ? (
              <a className="button primary" href={game.officialUrl} target="_blank" rel="noopener noreferrer">
                Ver Lanzamiento Oficial ↗
              </a>
            ) : (
              <button type="button" className="button primary" onClick={onDownload} disabled={!canDownload || downloading}>
                {downloading
                  ? 'Descargando...'
                  : game.status === 'FINALIZADO'
                    ? 'Playtesting Finalizado - Prototipo publicado oficialmente'
                    : 'Descargar prototipo'}
              </button>
            )}
            {isTester && (
              <button
                type="button"
                className={`button secondary${game.alreadyEvaluatedCurrentVersion ? ' evaluated-version-button' : ''}`}
                onClick={onEvaluate}
                disabled={!canEvaluate}
              >
                {game.alreadyEvaluatedCurrentVersion
                  ? `Versión ${formatVersion(game.version)} Evaluada ✓`
                  : `Evaluar ${formatVersion(game.version)}`}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
