import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'
import { createForm } from '../services/FormService'
import '../styles/Forms.css'
import { getGames } from '../services/GameService'

const questionTypes = [
  { value: 'TEXT', label: 'Texto', badge: 'Texto Abierto' },
  { value: 'LIKERT_1_5', label: 'Escala del 1 al 5', badge: 'Escala 1–5 ★' },
  { value: 'NUMERIC', label: 'Numérica', badge: 'Numérico' },
]

const emptyQuestion = () => ({ questionText: '', questionType: 'TEXT', required: true })

const templates = [
  {
    name: 'Jugabilidad y Controles',
    description: 'Fluidez, respuesta y dificultad',
    title: 'Evaluación de jugabilidad',
    questions: [
      { questionText: '¿Qué tan fluida se sintió la jugabilidad?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Qué tan intuitivos y responsivos fueron los controles?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Cómo calificarías la dificultad general?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Qué cambiarías para mejorar la experiencia de juego?', questionType: 'TEXT', required: false },
    ],
  },
  {
    name: 'Bugs y Rendimiento',
    description: 'Errores técnicos, estabilidad y FPS',
    title: 'Reporte técnico de playtest',
    questions: [
      { questionText: '¿Encontraste algún error o comportamiento inesperado? Describe cómo reproducirlo.', questionType: 'TEXT', required: true },
      { questionText: '¿Qué tan estable fue el juego durante tu sesión?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Cómo calificarías el rendimiento y la fluidez de imagen?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Cuántas caídas o bloqueos importantes experimentaste?', questionType: 'NUMERIC', required: false },
    ],
  },
  {
    name: 'Arte, Sonido y Diversión',
    description: 'Estilo audiovisual y rejugabilidad',
    title: 'Impresiones de arte y diversión',
    questions: [
      { questionText: '¿Qué tan atractivo te pareció el estilo visual?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Qué tan bien acompaña el audio a la experiencia?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Qué tan divertido te resultó jugar este prototipo?', questionType: 'LIKERT_1_5', required: true },
      { questionText: '¿Volverías a jugar o recomendarías este juego? ¿Por qué?', questionType: 'TEXT', required: false },
    ],
  },
]

function getQuestionType(value) {
  return questionTypes.find((type) => type.value === value) || questionTypes[0]
}

function PreviewQuestion({ question, index }) {
  return (
    <fieldset className="tester-preview-question">
      <legend>{index + 1}. {question.questionText || 'Tu pregunta aparecerá aquí'}{question.required ? <span className="required-mark"> *</span> : null}</legend>
      {question.questionType === 'LIKERT_1_5' ? (
        <div className="tester-preview-stars" aria-label="Vista de escala de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((value) => <span key={value} aria-hidden="true">★</span>)}
          <div className="tester-preview-scale"><span>Muy mal</span><span>Excelente</span></div>
        </div>
      ) : question.questionType === 'NUMERIC' ? (
        <input type="number" disabled placeholder="Escribe un número..." aria-label="Respuesta numérica de ejemplo" />
      ) : (
        <textarea disabled rows="3" placeholder="Escribe tu respuesta..." aria-label="Respuesta de texto de ejemplo" />
      )}
    </fieldset>
  )
}

export default function CreateFormPage() {
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [games, setGames] = useState([])
  const [gameId, setGameId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getGames()
      .then((allGames) => {
        const creatorGames = allGames.filter((game) => game.creatorUsername === user?.username)
        setGames(creatorGames)
        if (creatorGames.length) setGameId(String(creatorGames[0].id))
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [user?.username])

  function updateQuestion(index, field, value) {
    setQuestions((current) => current.map((question, questionIndex) => (
      questionIndex === index ? { ...question, [field]: value } : question
    )))
  }

  function addQuestion() {
    setQuestions((current) => [...current, emptyQuestion()])
  }

  function removeQuestion(index) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))
  }

  function moveQuestion(index, offset) {
    setQuestions((current) => {
      const targetIndex = index + offset
      if (targetIndex < 0 || targetIndex >= current.length) return current
      const reordered = [...current]
      ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
      return reordered
    })
  }

  function applyTemplate(template) {
    setTitle(template.title)
    setDescription(template.description)
    setQuestions(template.questions.map((question) => ({ ...question })))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!gameId || !games.some((game) => String(game.id) === gameId)) {
      setError('Selecciona un juego válido para el formulario.')
      return
    }
    if (!title.trim()) {
      setError('El título del formulario no puede estar vacío.')
      return
    }
    if (title.trim().length > 150) {
      setError('El título del formulario no puede superar los 150 caracteres.')
      return
    }
    if (questions.length === 0) {
      setError('Selecciona un juego y agrega al menos una pregunta.')
      return
    }
    const emptyQuestionIndexes = questions
      .map((question, index) => question.questionText.trim() ? null : index + 1)
      .filter((index) => index !== null)
    if (emptyQuestionIndexes.length) {
      setError(`Completa el texto de la(s) pregunta(s): ${emptyQuestionIndexes.join(', ')}.`)
      return
    }
    setSaving(true)
    try {
      await createForm(gameId, { title, description, questions })
      navigate('/catalog')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedGame = games.find((game) => String(game.id) === gameId)

  return (
    <main className="content-shell studio-page">
      <section className="studio-page-heading">
        <div>
          <span className="eyebrow">ESTUDIO DE PLAYTEST</span>
          <h1>Crear formulario</h1>
          <p>Diseña preguntas claras para convertir cada sesión en feedback útil.</p>
        </div>
        <span className="studio-step-indicator">CONSTRUCTOR <span>•</span> {questions.length} PREGUNTA{questions.length === 1 ? '' : 'S'}</span>
      </section>

      <div className="studio-layout create-form-layout">
        <section className="studio-panel studio-form-panel">
          {loading ? <p className="status-message">Cargando tus juegos...</p> : (
            <form noValidate onSubmit={handleSubmit}>
              <section className="template-section">
                <div className="studio-section-title template-section-heading"><span>✦</span><div><h2>Plantillas Rápidas</h2><p>Elige una base profesional y personalízala a tu medida.</p></div></div>
                <div className="template-grid">
                  {templates.map((template) => (
                    <button className="template-card" key={template.name} type="button" onClick={() => applyTemplate(template)}>
                      <strong>{template.name}</strong>
                      <span>{template.description}</span>
                      <span className="template-load">Cargar plantilla <span aria-hidden="true">→</span></span>
                    </button>
                  ))}
                </div>
              </section>

              <section className="studio-form-section">
                <div className="studio-section-title"><span>01</span><div><h2>Detalles del Formulario</h2><p>Selecciona el prototipo y define el propósito del playtest.</p></div></div>
                <div className="studio-field-grid">
                  <div className="studio-field studio-field-wide">
                    <label htmlFor="gameId">Juego <span className="required-mark">*</span></label>
                    <select id="gameId" value={gameId} onChange={(event) => setGameId(event.target.value)} required>
                      {games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
                    </select>
                  </div>
                  <div className="studio-field studio-field-wide">
                    <label htmlFor="form-title">Título del formulario <span className="required-mark">*</span></label>
                    <input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength="150" required placeholder="Ej. Sesión de juego — primera impresión" />
                  </div>
                  <div className="studio-field studio-field-wide">
                    <label htmlFor="form-description">Instrucciones para el tester</label>
                    <textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} rows="3" placeholder="Indica qué probar y cuánto tiempo dedicar..." />
                  </div>
                </div>
              </section>

              <section className="studio-form-section">
                <div className="studio-section-title"><span>02</span><div><h2>Constructor de Preguntas</h2><p>Combina escalas, comentarios y datos numéricos.</p></div></div>
                <div className="question-list">
                  {questions.map((question, index) => (
                    <fieldset className="question-card studio-question-card" key={index}>
                      <legend>Pregunta {String(index + 1).padStart(2, '0')}</legend>
                      <div className="studio-question-card-header">
                        <span className={`question-type-badge question-type-${question.questionType.toLowerCase()}`}>{getQuestionType(question.questionType).badge}</span>
                        <div className="question-order-actions">
                          <button type="button" onClick={() => moveQuestion(index, -1)} disabled={index === 0} aria-label={`Mover pregunta ${index + 1} arriba`}>↑</button>
                          <button type="button" onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1} aria-label={`Mover pregunta ${index + 1} abajo`}>↓</button>
                          <button type="button" className="question-remove-button" onClick={() => removeQuestion(index)} disabled={questions.length === 1} aria-label={`Eliminar pregunta ${index + 1}`}>×</button>
                        </div>
                      </div>
                      <div className="studio-field-grid">
                        <div className="studio-field studio-field-wide">
                          <label htmlFor={`question-${index}`}>Texto de la pregunta <span className="required-mark">*</span></label>
                          <input
                            id={`question-${index}`}
                            value={question.questionText}
                            onChange={(event) => updateQuestion(index, 'questionText', event.target.value)}
                            required
                            placeholder="Escribe una pregunta concreta y fácil de responder"
                          />
                        </div>
                        <div className="studio-field">
                          <label htmlFor={`type-${index}`}>Tipo de respuesta</label>
                          <select
                            id={`type-${index}`}
                            value={question.questionType}
                            onChange={(event) => updateQuestion(index, 'questionType', event.target.value)}
                          >
                            {questionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                          </select>
                        </div>
                        <label className="checkbox-label studio-required-toggle">
                          <input
                            type="checkbox"
                            checked={question.required}
                            onChange={(event) => updateQuestion(index, 'required', event.target.checked)}
                          />
                          Respuesta obligatoria
                        </label>
                      </div>
                    </fieldset>
                  ))}
                </div>
                {games.length === 0 && <p className="status-message">Publica un juego antes de crear un formulario.</p>}
                {error && <p className="error-message">{error}</p>}
                <button type="button" className="button secondary add-question-button" onClick={addQuestion}>+ Agregar pregunta</button>
              </section>
              <button className="button primary full-width studio-submit-button" type="submit" disabled={saving || games.length === 0}>
                {saving ? 'Guardando...' : 'Crear formulario'}
              </button>
            </form>
          )}
        </section>

        <aside className="studio-preview-column">
          <div className="studio-preview-sticky">
            <div className="studio-preview-heading">
              <span className="eyebrow">VISTA DEL TESTER</span>
              <h2>Así lo verá el Tester</h2>
              <p>Previsualización interactiva de solo lectura.</p>
            </div>
            <article className="tester-form-preview">
              <div className="tester-form-preview-top">
                <span className="tester-preview-overline">PLAYTEST · {selectedGame?.title || 'TU PROTOTIPO'}</span>
                <span className="tester-preview-secure">FORMULARIO</span>
              </div>
              <h3>{title || 'Título del formulario'}</h3>
              <p className="tester-preview-description">{description || 'Las instrucciones para el tester aparecerán aquí.'}</p>
              <div className="tester-preview-question-list">
                {questions.map((question, index) => <PreviewQuestion question={question} index={index} key={index} />)}
              </div>
              <button type="button" className="button primary full-width" disabled>Enviar respuestas</button>
              <span className="tester-preview-readonly">Vista previa · Las respuestas no se guardarán</span>
            </article>
            <div className="studio-preview-note"><span>✦</span> Las preguntas concisas y específicas suelen generar feedback más accionable.</div>
          </div>
        </aside>
      </div>
    </main>
  )
}
