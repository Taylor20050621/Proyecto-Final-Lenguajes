import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getFormByGameId, submitFeedback } from '../services/FormService'
import '../styles/Forms.css'

export default function FormViewPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [formUnavailable, setFormUnavailable] = useState(false)
  const [saving, setSaving] = useState(false)

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
        <form onSubmit={handleSubmit}>
          {form.questions.map((question) => (
            <fieldset className="question-card" key={question.id}>
              <legend>{question.questionText}{question.required ? ' *' : ''}</legend>
              {question.questionType === 'TEXT' && (
                <textarea rows="4" value={answers[question.id] || ''} required={question.required} onChange={(event) => updateAnswer(question, event.target.value)} />
              )}
              {question.questionType === 'NUMERIC' && (
                <input type="number" value={answers[question.id] || ''} required={question.required} onChange={(event) => updateAnswer(question, event.target.value)} />
              )}
              {question.questionType === 'LIKERT_1_5' && (
                <div className="rating-options">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="rating-option">
                      <input type="radio" name={`question-${question.id}`} value={value} required={question.required} checked={String(answers[question.id]) === String(value)} onChange={(event) => updateAnswer(question, event.target.value)} />
                      {value}
                    </label>
                  ))}
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
