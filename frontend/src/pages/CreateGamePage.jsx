import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGame } from '../services/GameService'
import { validateCoverFile, validatePrototypeFile } from '../services/validation'
import '../styles/Forms.css'

const genres = ['Acción', 'Aventura', 'RPG', 'Terror', 'Plataformas', 'Puzzle', 'Estrategia']
const platforms = [
  ['PC', 'PC'],
  ['ANDROID', 'Android'],
  ['IOS', 'iOS'],
  ['PLAYSTATION', 'PlayStation'],
  ['XBOX', 'Xbox'],
  ['NINTENDO_SWITCH', 'Nintendo Switch'],
  ['WEB', 'Web / Navegador'],
]

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  const sizeKb = bytes / 1024
  if (sizeKb < 1024) return `${sizeKb.toFixed(1).replace(/\.0$/, '')} KB`
  return `${(sizeKb / 1024).toFixed(1).replace(/\.0$/, '')} MB`
}

function getDisplayName(value, fallback) {
  return value.trim() || fallback
}

function getFileExtension(file) {
  return file?.name?.split('.').pop()?.toUpperCase() || 'ARCHIVO'
}

function DropZone({ id, name, accept, file, onFileChange, onDrop, description, previewUrl }) {
  return (
    <div
      className={`upload-dropzone${file ? ' upload-dropzone-selected' : ''}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event)}
    >
      <input
        className="upload-file-input"
        id={id}
        name={name}
        type="file"
        accept={accept}
        onChange={(event) => onFileChange(event.target.files[0] || null)}
      />
      <label className="upload-dropzone-label" htmlFor={id}>
        {previewUrl ? (
          <img className="upload-cover-preview" src={previewUrl} alt="Vista previa de la portada" />
        ) : (
          <span className="upload-dropzone-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </svg>
          </span>
        )}
        <span className="upload-dropzone-copy">
          <strong>{file ? file.name : 'Arrastra tu archivo aquí o haz clic para elegir'}</strong>
          <span>{file ? `${formatFileSize(file.size)}${file.type.startsWith('image/') ? '' : ` · ${getFileExtension(file)}`}` : description}</span>
        </span>
        <span className="upload-dropzone-action">{file ? 'Cambiar' : 'Seleccionar'}</span>
      </label>
    </div>
  )
}

export default function CreateGamePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    genre: '',
    platform: 'PC',
    releaseNotes: '',
  })
  const [file, setFile] = useState(null)
  const [coverImage, setCoverImage] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('')

  useEffect(() => {
    if (!coverImage) {
      setCoverPreviewUrl('')
      return undefined
    }
    const objectUrl = URL.createObjectURL(coverImage)
    setCoverPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [coverImage])

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  function handleDrop(event, onFile) {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) onFile(droppedFile)
  }

  function selectPrototypeFile(selectedFile) {
    const validationError = validatePrototypeFile(selectedFile)
    if (validationError) {
      setFile(null)
      setError(validationError)
      return
    }
    setError('')
    setFile(selectedFile)
  }

  function selectCoverFile(selectedFile) {
    const validationError = validateCoverFile(selectedFile)
    if (validationError) {
      setCoverImage(null)
      setError(validationError)
      return
    }
    setError('')
    setCoverImage(selectedFile)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const title = form.title.trim()
    const description = form.description.trim()
    if (title.length < 2 || title.length > 100) {
      setError('El título debe tener entre 2 y 100 caracteres.')
      return
    }
    if (!description || description.length > 1000) {
      setError('La descripción es obligatoria y no puede superar los 1000 caracteres.')
      return
    }
    if (!platforms.some(([value]) => value === form.platform)) {
      setError('Selecciona una plataforma válida.')
      return
    }
    if (form.genre.length > 80 || form.releaseNotes.length > 1000) {
      setError('El género no puede superar los 80 caracteres y las notas no pueden superar los 1000 caracteres.')
      return
    }
    const prototypeError = validatePrototypeFile(file)
    if (prototypeError) {
      setError(prototypeError)
      return
    }
    const coverError = validateCoverFile(coverImage)
    if (coverError) {
      setError(coverError)
      return
    }

    setLoading(true)
    try {
      await createGame({ ...form, file, coverImage })
      setSuccess('El juego se publicó correctamente.')
      setForm({ title: '', description: '', genre: '', platform: 'PC', releaseNotes: '' })
      setFile(null)
      setCoverImage(null)
      event.target.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="content-shell studio-page">
      <section className="studio-page-heading">
        <div>
          <span className="eyebrow">ESTUDIO DE PUBLICACIÓN</span>
          <h1>Publicar juego</h1>
          <p>Prepara tu prototipo para compartirlo con la comunidad de playtesters.</p>
        </div>
        <span className="studio-step-indicator">NUEVO PROTOTIPO <span>•</span> 01 / 01</span>
      </section>

      <div className="studio-layout create-game-layout">
        <section className="studio-panel studio-form-panel">
          <form noValidate onSubmit={handleSubmit}>
            <section className="studio-form-section">
              <div className="studio-section-title"><span>01</span><div><h2>Identidad del Prototipo</h2><p>Los detalles que ayudarán a descubrir tu juego.</p></div></div>
              <div className="studio-field-grid">
                <div className="studio-field studio-field-wide">
                  <label htmlFor="title">Título del juego <span className="required-mark">*</span></label>
                  <input id="title" name="title" value={form.title} onChange={updateField} minLength="2" maxLength="100" placeholder="Ej. Las ruinas del alba" required />
                </div>
                <div className="studio-field">
                  <label htmlFor="platform">Plataforma <span className="required-mark">*</span></label>
                  <select id="platform" name="platform" value={form.platform} onChange={updateField} required>
                    {platforms.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                <div className="studio-field">
                  <label htmlFor="genre">Género</label>
                  <input id="genre" name="genre" value={form.genre} onChange={updateField} list="game-genres" maxLength="80" placeholder="Elige o escribe un género" />
                  <datalist id="game-genres">{genres.map((genre) => <option key={genre} value={genre} />)}</datalist>
                  <div className="genre-suggestions" aria-label="Sugerencias de género">
                    {genres.map((genre) => (
                      <button type="button" className={`genre-pill${form.genre === genre ? ' genre-pill-active' : ''}`} key={genre} onClick={() => setForm((current) => ({ ...current, genre }))}>
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="studio-field studio-field-wide">
                  <label htmlFor="description">Descripción</label>
                  <textarea id="description" name="description" value={form.description} onChange={updateField} rows="4" maxLength="1000" placeholder="¿Qué hace único a tu prototipo? Comparte el concepto y la experiencia que buscas..." required />
                  <span className="character-count">{form.description.length} / 1000 caracteres</span>
                </div>
              </div>
            </section>

            <section className="studio-form-section">
              <div className="studio-section-title"><span>02</span><div><h2>Notas de Versión</h2><p>Cuéntales a los testers qué deben tener en cuenta.</p></div></div>
              <div className="studio-field">
                <label htmlFor="releaseNotes">Changelog inicial <span className="optional-label">OPCIONAL</span></label>
                <textarea id="releaseNotes" name="releaseNotes" value={form.releaseNotes} onChange={updateField} rows="3" maxLength="1000" placeholder="Controles, objetivos de prueba o cambios recientes..." />
                <span className="character-count">{form.releaseNotes.length} / 1000 caracteres</span>
              </div>
            </section>

            <section className="studio-form-section">
              <div className="studio-section-title"><span>03</span><div><h2>Archivos y Portada</h2><p>Sube el prototipo y dale una identidad visual.</p></div></div>
              <div className="studio-field">
                <label htmlFor="file">Archivo del prototipo <span className="required-mark">*</span></label>
                <DropZone
                  id="file"
                  name="file"
                  accept=".exe,.zip,.rar,.7z,.apk,.pdf"
                  file={file}
                  onFileChange={selectPrototypeFile}
                  onDrop={(event) => handleDrop(event, selectPrototypeFile)}
                  description="Formatos permitidos: .EXE, .ZIP, .RAR, .7Z, .APK o .PDF · Máximo 4 GB"
                />
                <p className="file-hint">El archivo se entregará a los testers cuando descarguen tu prototipo.</p>
              </div>
              <div className="studio-field">
                <label htmlFor="cover-image">Portada <span className="optional-label">OPCIONAL</span></label>
                <DropZone
                  id="cover-image"
                  name="coverImage"
                  accept="image/png,image/jpeg,image/webp"
                  file={coverImage}
                  onFileChange={selectCoverFile}
                  onDrop={(event) => handleDrop(event, selectCoverFile)}
                  description="JPG, PNG o WebP · Máximo 10 MB"
                  previewUrl={coverPreviewUrl}
                />
              </div>
            </section>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <button className="button primary full-width studio-submit-button" type="submit" disabled={loading}>
              {loading ? 'Publicando...' : 'Publicar prototipo'}
            </button>
          </form>
          {success && (
            <button type="button" className="button secondary full-width" onClick={() => navigate('/catalog')}>
              Ver catálogo
            </button>
          )}
        </section>

        <aside className="studio-preview-column">
          <div className="studio-preview-sticky">
            <div className="studio-preview-heading">
              <span className="eyebrow">LIVE PREVIEW</span>
              <h2>Vista Previa en el Catálogo</h2>
              <p>Así verán tu prototipo los playtesters.</p>
            </div>
            <article className="studio-game-preview-card">
              <div className="studio-game-preview-cover">
                {coverPreviewUrl ? (
                  <img src={coverPreviewUrl} alt="Portada del prototipo" />
                ) : (
                  <span className="studio-preview-cover-placeholder" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="7" y="10" width="34" height="27" rx="3" />
                      <path d="M17 42h14M24 37v5M15 22h7m-3.5-3.5v7M29 21h.01M34 25h.01" strokeLinecap="round" />
                    </svg>
                    <span>{form.platform}</span>
                  </span>
                )}
              </div>
              <div className="studio-game-preview-body">
                <div className="studio-preview-card-header">
                  <span className="studio-preview-platform">{platforms.find(([value]) => value === form.platform)?.[1] || form.platform}</span>
                  <span className="studio-preview-genre">{getDisplayName(form.genre, 'Sin género')}</span>
                </div>
                <span className="studio-preview-status">En Playtesting</span>
                <h3>{getDisplayName(form.title, 'Título de tu juego')}</h3>
                <p className="studio-preview-description">{getDisplayName(form.description, 'Tu descripción aparecerá aquí para presentar el prototipo a la comunidad.')}</p>
                <dl className="studio-preview-details">
                  <div><dt>Versión</dt><dd>1.0</dd></div>
                  <div><dt>Archivo</dt><dd>{file ? `${getFileExtension(file)} • ${formatFileSize(file.size)}` : 'Aún no seleccionado'}</dd></div>
                </dl>
                <button type="button" className="button primary full-width" disabled>Descargar Prototipo</button>
              </div>
            </article>
            <div className="studio-preview-note"><span>✦</span> Una buena portada y descripción ayudan a que más testers descubran tu juego.</div>
          </div>
        </aside>
      </div>
    </main>
  )
}
