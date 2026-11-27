import { useState } from 'react'
import { getGameCoverUrl } from '../services/GameService'

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

export default function GameCover({ game, detail = false }) {
  const [imageUnavailable, setImageUnavailable] = useState(false)

  return (
    <div className={`game-cover${detail ? ' game-cover-detail' : ''}`}>
      {(!game.hasCoverImage || imageUnavailable) && (
        <div className="game-cover-placeholder" aria-label="Sin imagen de portada">
          <svg viewBox="0 0 48 48" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="7" y="10" width="34" height="27" rx="3" />
            <path d="M17 42h14M24 37v5M15 22h7m-3.5-3.5v7M29 21h.01M34 25h.01" strokeLinecap="round" />
          </svg>
          <span>{platformLabels[game.platform] || game.platform || 'Prototipo Indie'}</span>
        </div>
      )}
      {game.hasCoverImage && !imageUnavailable && (
        <img
          src={getGameCoverUrl(game.id)}
          alt={`Portada de ${game.title}`}
          onError={() => setImageUnavailable(true)}
        />
      )}
    </div>
  )
}
