import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFeedbackSummary } from '../services/FormService'

const questionTypeLabels = {
  LIKERT_1_5: 'Calificación',
  NUMERIC: 'Valor numérico',
  TEXT: 'Comentarios',
}

function formatMetric(value, suffix = '') {
  return value == null ? '—' : `${Number(value).toFixed(2)}${suffix}`
}

export default function GameDashboardPage() {
  const { gameId } = useParams()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFeedbackSummary(gameId)
      .then(setSummary)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [gameId])

  if (loading) {
    return <main className="content-shell"><p className="status-message">Cargando métricas...</p></main>
  }
  if (error) {
    return <main className="content-shell"><p className="error-message">{error}</p></main>
  }

  return (
    <main className="content-shell">
      <section className="page-heading">
        <span className="eyebrow">DASHBOARD DEL PROTOTIPO</span>
        <h1>Métricas y estadísticas</h1>
        <p>Analiza el feedback recibido de tus playtesters.</p>
      </section>
      <section className="kpi-grid">
        <article className="kpi-card"><span>Total de evaluaciones</span><strong>{summary.totalResponses}</strong></article>
        <article className="kpi-card"><span>Calificación promedio</span><strong>{formatMetric(summary.averageLikertScore, ' / 5')}</strong></article>
        <article className="kpi-card"><span>Tiempo promedio jugado</span><strong>{formatMetric(summary.averagePlayTime)}</strong></article>
      </section>
      <section className="dashboard-section">
        <h2>Desglose por pregunta</h2>
        {summary.questionSummaries.length === 0 && <p className="status-message">No hay respuestas para mostrar.</p>}
        <div className="question-summary-grid">
          {summary.questionSummaries.map((question) => (
            <article className="question-summary-card" key={question.questionId}>
              <span className="question-type">{questionTypeLabels[question.questionType]}</span>
              <h3>{question.questionText}</h3>
              {question.questionType === 'TEXT' ? (
                question.comments.length ? (
                  <ul className="comment-list">
                    {question.comments.map((comment, index) => <li key={`${question.questionId}-${index}`}>{comment}</li>)}
                  </ul>
                ) : <p className="muted">Sin comentarios.</p>
              ) : (
                <>
                  <strong className="question-average">{formatMetric(question.average, question.questionType === 'LIKERT_1_5' ? ' / 5' : '')}</strong>
                  {question.questionType === 'LIKERT_1_5' && (
                    <div className="metric-bar" aria-label={`${question.average || 0} de 5`}>
                      <span style={{ width: `${Math.min(100, ((question.average || 0) / 5) * 100)}%` }} />
                    </div>
                  )}
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
