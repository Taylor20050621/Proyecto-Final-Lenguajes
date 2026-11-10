import { useState } from 'react'
import { updateGameFile } from '../services/GameService'

export default function UpdateGameVersionModal({ game, onClose, onUpdated }) {
  const [version, setVersion] = useState(game.version || '1.0')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!file) {
      setError('Selecciona el nuevo archivo del prototipo.')
      return
    }
    setSaving(true)
    try {
      const updatedGame = await updateGameFile(game.id, version, file)
      onUpdated(updatedGame)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="update-game-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <span className="eyebrow">NUEVA VERSIÓN</span>
        <h2 id="update-game-title">Actualizar {game.title}</h2>
        <p className="muted">El historial de formularios y feedback se conservará.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="version">Versión</label>
          <input id="version" value={version} onChange={(event) => setVersion(event.target.value)} maxLength="20" required />
          <label htmlFor="updated-file">Nuevo archivo</label>
          <input
            id="updated-file"
            type="file"
            accept=".exe,.zip,.pdf,application/pdf,application/zip,application/x-zip-compressed"
            onChange={(event) => setFile(event.target.files[0] || null)}
            required
          />
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button primary" disabled={saving}>{saving ? 'Actualizando...' : 'Actualizar versión'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
