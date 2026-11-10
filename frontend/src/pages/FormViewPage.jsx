import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getActiveForm, submitFeedback } from '../services/FormService'

export default function FormViewPage() {
  const { gameId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getActiveForm(gameId)
      .then(setForm)
      .catch((requestError) => setError(requestError.message))
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
      navigate('/catalog')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <main className="content-shell"><p className="status-message">Cargando formulario...</p></main>
  if (!form) return <main className="content-shell"><p className="error-message">{error || 'No hay un formulario activo para este juego.'}</p></main>

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
