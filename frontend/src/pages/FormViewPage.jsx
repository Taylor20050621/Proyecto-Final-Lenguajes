import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getFormByGameId, submitFeedback } from '../services/FormService'
import { useToast } from '../contexts/ToastContext'
import '../styles/Forms.css'

const ratingLabels = {
  1: 'Muy bajo',
  2: 'Bajo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
}

export default function FormViewPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [formUnavailable, setFormUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hoveredRatings, setHoveredRatings] = useState({})
  const notify = useToast()

  useEffect(() => {
    setLoading(true)
    setFormUnavailable(false)
    setError('')
    getFormByGameId(gameId)
      .then(setForm)
      .catch((requestError) => {
        setForm(null)
        setFormUnavailable(true)
        setError(requestError.message)
      })
      .finally(() => setLoading(false))
  }, [gameId])

  function updateAnswer(question, value) {
    setAnswers((current) => ({ ...current, [question.id]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const unanswered = form.questions.filter((question) => {
      const value = answers[question.id]
      if (!question.required) return false
      if (question.questionType === 'TEXT') return typeof value !== 'string' || !value.trim()
      if (question.questionType === 'LIKERT_1_5') {
        const rating = Number(value)
        return !Number.isInteger(rating) || rating < 1 || rating > 5
      }
      if (question.questionType === 'NUMERIC') {
        return value === undefined
          || value === ''
          || !Number.isFinite(Number(value))
          || !/^-?\d{1,8}(?:\.\d{1,2})?$/.test(String(value))
      }
      return true
    })
    const invalidAnswers = form.questions.filter((question) => {
      const value = answers[question.id]
      if (value === undefined || value === '') return false
      if (question.questionType === 'LIKERT_1_5') {
        const rating = Number(value)
        return !Number.isInteger(rating) || rating < 1 || rating > 5
      }
      if (question.questionType === 'NUMERIC') {
        return !Number.isFinite(Number(value)) || !/^-?\d{1,8}(?:\.\d{1,2})?$/.test(String(value))
      }
      return false
    })
    if (unanswered.length || invalidAnswers.length) {
      const missingNames = unanswered.map((question) => question.questionText)
      const invalidNames = invalidAnswers.map((question) => question.questionText)
      const parts = []
      if (missingNames.length) parts.push(`Responde las preguntas obligatorias: ${missingNames.join('; ')}.`)
      if (invalidNames.length) parts.push(`Revisa las respuestas numéricas de: ${invalidNames.join('; ')}.`)
      setError(parts.join(' '))
      return
    }
    setSaving(true)
    try {
      const requestAnswers = form.questions.filter((question) => {
        const value = answers[question.id]
        return value !== undefined && value !== ''
      }).map((question) => {
        const value = answers[question.id]
        if (question.questionType === 'TEXT') return { questionId: question.id, answerText: value || null, numericValue: null }
        return { questionId: question.id, answerText: null, numericValue: value === '' || value === undefined ? null : Number(value) }
      })
      await submitFeedback(form.id, requestAnswers)
      window.dispatchEvent(new Event('user-profile-updated'))
      notify('Evaluación enviada. ¡Ganaste 50 puntos!')
      navigate('/catalog')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="content-shell"><p className="status-message">Cargando formulario...</p></main>
  if (!form) {
    return (
      <main className="content-shell narrow-shell">
        <section className="form-card form-empty-state">
          <span className="eyebrow">FORMULARIO NO DISPONIBLE</span>
          <h1>Este juego aún no cuenta con un formulario de evaluación publicado</h1>
          <p>El creador todavía no ha publicado una encuesta para este prototipo. Puedes volver al catálogo y explorar otros juegos.</p>
          {error && !formUnavailable && <p className="error-message">{error}</p>}
          <button type="button" className="button secondary full-width" onClick={() => navigate('/catalog')}>
            Volver al catálogo
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="content-shell narrow-shell">
      <section className="form-card">
        <span className="eyebrow">FEEDBACK DEL PLAYTEST</span>
        <h1>{form.title}</h1>
        <p>{form.description}</p>
        <form noValidate onSubmit={handleSubmit}>
          {form.questions.map((question) => (
            <fieldset className="question-card" key={question.id}>
              <legend>{question.questionText}{question.required ? ' *' : ''}</legend>
              {question.questionType === 'TEXT' && (
                <textarea rows="4" value={answers[question.id] || ''} required={question.required} onChange={(event) => updateAnswer(question, event.target.value)} />
              )}
              {question.questionType === 'NUMERIC' && (
                <input type="number" min="-99999999.99" max="99999999.99" step="0.01" value={answers[question.id] || ''} required={question.required} onChange={(event) => updateAnswer(question, event.target.value)} />
              )}
              {question.questionType === 'LIKERT_1_5' && (
                <div
                  className="rating-stars"
                  role="radiogroup"
                  aria-label={question.questionText}
                  onMouseLeave={() => setHoveredRatings((current) => ({ ...current, [question.id]: null }))}
                >
                  <div className="rating-stars-options">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="rating-star-option" onMouseEnter={() => setHoveredRatings((current) => ({ ...current, [question.id]: value }))}>
                      <input
                        className="rating-star-input"
                        type="radio"
                        name={`question-${question.id}`}
                        value={value}
                        required={question.required}
                        checked={String(answers[question.id]) === String(value)}
                        aria-label={`${value}: ${ratingLabels[value]}`}
                        onChange={(event) => updateAnswer(question, event.target.value)}
                      />
                      <svg className={value <= (hoveredRatings[question.id] || Number(answers[question.id]) || 0) ? 'rating-star-active' : ''} viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m12 2.8 2.85 5.78 6.38.93-4.62 4.5 1.09 6.35L12 17.36l-5.7 3 1.09-6.35-4.62-4.5 6.38-.93L12 2.8Z" />
                      </svg>
                      <span className="visually-hidden">{value}</span>
                    </label>
                  ))}
                  </div>
                  <span className="rating-description">
                    {ratingLabels[hoveredRatings[question.id] || Number(answers[question.id])]
                      ? `${hoveredRatings[question.id] || answers[question.id]}: ${ratingLabels[hoveredRatings[question.id] || Number(answers[question.id])]}`
                      : 'Selecciona una calificación'}
                  </span>
                </div>
              )}
            </fieldset>
          ))}
          {error && <p className="error-message">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={saving}>{saving ? 'Enviando...' : 'Enviar evaluación'}</button>
        </form>
      </section>
    </main>
  )
}
