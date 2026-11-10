import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from '../services/GameService'

const genres = ['Acción', 'Aventura', 'Casual', 'Estrategia', 'Horror', 'Plataformas', 'RPG', 'Simulación']

export default function CreateGamePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    platform: 'PC',
  })
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!file) {
      setError('Selecciona el archivo del prototipo.')
      return
    }

    setLoading(true)
    try {
      await createGame({ ...form, file })
      setSuccess('El juego se publicó correctamente.')
      setForm({ title: '', description: '', genre: '', platform: 'PC' })
      setFile(null)
      event.target.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="content-shell narrow-shell">
      <section className="form-card">
        <span className="eyebrow">COMPARTE TU PROTOTIPO</span>
        <h1>Publicar juego</h1>
        <p className="muted">Presenta tu juego a la comunidad de playtesters.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Título</label>
          <input id="title" name="title" value={form.title} onChange={updateField} maxLength="150" required />
          <label htmlFor="description">Descripción</label>
          <textarea id="description" name="description" value={form.description} onChange={updateField} rows="4" />
          <label htmlFor="genre">Género</label>
          <select id="genre" name="genre" value={form.genre} onChange={updateField}>
            <option value="">Selecciona un género</option>
            {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
          </select>
          <label htmlFor="platform">Plataforma</label>
          <select id="platform" name="platform" value={form.platform} onChange={updateField} required>
            <option value="PC">PC</option>
            <option value="WEBGL">WebGL</option>
            <option value="PRINT_AND_PLAY">Print &amp; Play</option>
          </select>
          <label htmlFor="file">Archivo del prototipo</label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".exe,.zip,.pdf,application/pdf,application/zip,application/x-zip-compressed"
            onChange={(event) => setFile(event.target.files[0] || null)}
            required
          />
          <p className="file-hint">Formatos permitidos: .exe, .zip o .pdf.</p>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button className="button primary full-width" type="submit" disabled={loading}>
            {loading ? 'Publicando...' : 'Publicar juego'}
          </button>
        </form>
        {success && (
          <button type="button" className="button secondary full-width" onClick={() => navigate('/catalog')}>
            Ver catálogo
          </button>
        )}
      </section>
    </main>
  )
}
