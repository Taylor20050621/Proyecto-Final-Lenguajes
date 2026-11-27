import { useEffect } from 'react'

export default function ConfirmStatusModal({
  game,
  officialUrl,
  error,
  submitting,
  isEditing,
  onOfficialUrlChange,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, submitting])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && !submitting && onClose()}
    >
      <section
        className="modal-card confirm-status-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-status-title"
        aria-describedby="confirm-status-warning"
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar" disabled={submitting}>×</button>
        <span className="eyebrow">LANZAMIENTO OFICIAL</span>
        <h2 id="confirm-status-title">{isEditing ? 'Editar enlace oficial' : 'Confirmar finalización'}</h2>
        {isEditing ? (
          <p className="confirmation-context">Actualiza opcionalmente el enlace oficial de {game.title}.</p>
        ) : (
          <p id="confirm-status-warning" className="confirmation-warning">
            ¿Estás seguro de marcar '{game.title}' como FINALIZADO? Esta acción cerrará permanentemente la recepción de nuevas evaluaciones de testers y notificará que el prototipo completó su ciclo de pruebas.
          </p>
        )}
        <form noValidate onSubmit={onConfirm}>
          <label htmlFor="official-url">Enlace Oficial de Lanzamiento (opcional)</label>
          <input
            id="official-url"
            type="text"
            inputMode="url"
            maxLength="500"
            placeholder="https://..."
            value={officialUrl}
            onChange={(event) => onOfficialUrlChange(event.target.value)}
            disabled={submitting}
          />
          {error && <p className="error-message">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="button secondary" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="button primary" disabled={submitting}>
              {submitting ? 'Guardando...' : isEditing ? 'Guardar enlace oficial' : 'Confirmar Finalización'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
