import { useState } from 'react'
import { updateGameFile } from '../services/GameService'
import { isValidVersion, validateCoverFile, validatePrototypeFile } from '../services/validation'

export default function UpdateGameVersionModal({ game, onClose, onUpdated }) {
  const [version, setVersion] = useState(game.version || '1.0')
  const [releaseNotes, setReleaseNotes] = useState(game.releaseNotes || '')
  const [file, setFile] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!file) {
      setError(validatePrototypeFile(file))
      return
    }
    if (!version.trim() || !isValidVersion(version)) {
      setError('Ingresa una versión válida, por ejemplo 1.0 o v1.2.')
      return
    }
    if (version.trim().length > 20 || releaseNotes.length > 1000) {
      setError('La versión no puede superar los 20 caracteres y las notas no pueden superar los 1000 caracteres.')
      return
    }
    const fileError = validatePrototypeFile(file)
    if (fileError) {
      setError(fileError)
      return
    }
    const coverError = validateCoverFile(coverImage)
    if (coverError) {
      setError(coverError)
      return
    }
    setSaving(true)
    try {
      const updatedGame = await updateGameFile(game.id, version, file, releaseNotes, coverImage)
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
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="version">Versión</label>
          <input id="version" value={version} onChange={(event) => setVersion(event.target.value)} maxLength="20" pattern="v?\d+(\.\d+){1,2}" placeholder="Ej. 1.0 o v1.2" required />
          <label htmlFor="release-notes">Notas de la versión (Changelog)</label>
          <textarea id="release-notes" value={releaseNotes} onChange={(event) => setReleaseNotes(event.target.value)} rows="3" maxLength="1000" />
          <label htmlFor="updated-file">Nuevo archivo</label>
          <input
            id="updated-file"
            type="file"
            accept=".exe,.zip,.rar,.7z,.apk,.pdf"
            onChange={(event) => setFile(event.target.files[0] || null)}
            required
          />
          <label htmlFor="updated-cover-image">Actualizar imagen de portada (JPG, PNG, WebP)</label>
          <input
            id="updated-cover-image"
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(event) => setCoverImage(event.target.files[0] || null)}
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
