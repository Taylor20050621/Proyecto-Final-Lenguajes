import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../services/AuthService'
import { createForm } from '../services/FormService'
import { getGames } from '../services/GameService'

const questionTypes = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'LIKERT_1_5', label: 'Escala del 1 al 5' },
  { value: 'NUMERIC', label: 'Numérica' },
]

const emptyQuestion = () => ({ questionText: '', questionType: 'TEXT', required: true })

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

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!gameId || questions.length === 0) {
      setError('Selecciona un juego y agrega al menos una pregunta.')
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

  return (
    <main className="content-shell narrow-shell">
      <section className="form-card">
        <span className="eyebrow">RECOPILA OPINIONES</span>
        <h1>Crear formulario</h1>
        {loading ? <p className="status-message">Cargando tus juegos...</p> : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="gameId">Juego</label>
            <select id="gameId" value={gameId} onChange={(event) => setGameId(event.target.value)} required>
              {games.map((game) => <option key={game.id} value={game.id}>{game.title}</option>)}
            </select>
            <label htmlFor="form-title">Título del formulario</label>
            <input id="form-title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <label htmlFor="form-description">Descripción</label>
            <textarea id="form-description" value={description} onChange={(event) => setDescription(event.target.value)} rows="3" />
            <div className="question-list">
              {questions.map((question, index) => (
                <fieldset className="question-card" key={index}>
                  <legend>Pregunta {index + 1}</legend>
                  <label htmlFor={`question-${index}`}>Texto</label>
                  <input
                    id={`question-${index}`}
                    value={question.questionText}
                    onChange={(event) => updateQuestion(index, 'questionText', event.target.value)}
                    required
                  />
                  <label htmlFor={`type-${index}`}>Tipo</label>
                  <select
                    id={`type-${index}`}
                    value={question.questionType}
                    onChange={(event) => updateQuestion(index, 'questionType', event.target.value)}
                  >
                    {questionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={question.required}
                      onChange={(event) => updateQuestion(index, 'required', event.target.checked)}
                    />
                    Obligatoria
                  </label>
                  {questions.length > 1 && (
                    <button type="button" className="text-button" onClick={() => removeQuestion(index)}>Eliminar pregunta</button>
                  )}
                </fieldset>
              ))}
            </div>
            {games.length === 0 && <p className="status-message">Publica un juego antes de crear un formulario.</p>}
            {error && <p className="error-message">{error}</p>}
            <button type="button" className="button secondary full-width" onClick={addQuestion}>Agregar pregunta</button>
            <button className="button primary full-width" type="submit" disabled={saving || games.length === 0}>
              {saving ? 'Guardando...' : 'Crear formulario'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
