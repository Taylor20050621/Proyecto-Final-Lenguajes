import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFeedback } from '../services/FormService'

export default function FeedbackResultsPage() {
  const { gameId } = useParams()
  const [feedback, setFeedback] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeedback(gameId)
      .then(setFeedback)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [gameId])

  return (
    <main className="content-shell narrow-shell">
      <section className="page-heading">
        <span className="eyebrow">RESULTADOS DEL PLAYTEST</span>
        <h1>Respuestas recibidas</h1>
      </section>
      {loading && <p className="status-message">Cargando respuestas...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && feedback.length === 0 && <p className="status-message">Todavía no hay respuestas.</p>}
      <section className="feedback-list">
        {feedback.map((response) => (
          <article className="feedback-card" key={response.id}>
            <div className="feedback-meta"><strong>{response.testerUsername}</strong><span>{new Date(response.submittedAt).toLocaleString()}</span></div>
            {response.answers.map((answer) => (
              <div className="answer-row" key={answer.questionId}>
                <strong>{answer.questionText}</strong>
                <span>{answer.answerText ?? answer.numericValue}</span>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>
  )
}
