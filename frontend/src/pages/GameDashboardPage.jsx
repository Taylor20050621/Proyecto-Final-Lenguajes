import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFeedbackSummary } from '../services/FormService'
import { getGameById } from '../services/GameService'
import { useToast } from '../contexts/ToastContext'
import '../styles/GameDashboard.css'

const questionTypeLabels = {
  LIKERT_1_5: 'Calificación',
  NUMERIC: 'Valor numérico',
  TEXT: 'Comentarios',
}

const gameStatusLabels = {
  EN_PLAYTESTING: 'En Playtesting',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
}

function formatMetric(value, suffix = '') {
  return value == null ? '—' : `${Number(value).toFixed(2)}${suffix}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export default function GameDashboardPage() {
  const { gameId } = useParams()
  const [summary, setSummary] = useState(null)
  const [game, setGame] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const notify = useToast()

  useEffect(() => {
    Promise.all([getFeedbackSummary(gameId), getGameById(gameId)])
      .then(([feedbackSummary, gameData]) => {
        setSummary(feedbackSummary)
        setGame(gameData)
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [gameId])

  function exportExcelReport() {
    const reportDate = new Date().toLocaleString()
    const summaryRows = [
      ['Título del prototipo', game.title],
      ['Versión actual', game.version || '1.0'],
      ['Estado', gameStatusLabels[game.status] || game.status],
      ['Total de evaluaciones', summary.totalResponses],
      ['Promedio general de satisfacción', formatMetric(summary.averageLikertScore, ' / 5')],
      ['Tiempo promedio jugado', formatMetric(summary.averagePlayTime)],
    ].map(([metric, value]) => `<tr><td>${escapeHtml(metric)}</td><td>${escapeHtml(value)}</td></tr>`).join('')

    const questionRows = summary.questionSummaries.map((question, index) => {
      const comments = question.comments || []
      const questionSummary = question.questionType === 'TEXT'
        ? `${comments.length} comentario(s)`
        : formatMetric(question.average, question.questionType === 'LIKERT_1_5' ? ' / 5' : '')
      const commentsCell = comments.length
        ? comments.map((comment) => `• ${escapeHtml(comment)}`).join('<br>')
        : '—'
      return `<tr class="${index % 2 === 0 ? 'even' : 'odd'}">
        <td>${escapeHtml(question.questionText)}</td>
        <td>${escapeHtml(questionTypeLabels[question.questionType] || question.questionType)}</td>
        <td>${escapeHtml(questionSummary)}</td>
        <td>${commentsCell}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta charset="UTF-8">
  <meta name="ProgId" content="Excel.Sheet">
  <meta name="Generator" content="Microsoft Excel">
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #242424; }
    table { border-collapse: collapse; margin: 0 0 22px; width: 100%; }
    td, th { border: 1px solid #D0D0D0; padding: 8px 10px; vertical-align: top; }
    .report-title { background: #1C1C1C; border-bottom: 4px solid #B3261E; color: #EDE6D8; font-size: 18pt; font-weight: bold; padding: 14px; }
    .report-date { background: #1C1C1C; color: #EDE6D8; padding: 8px 14px 14px; }
    .section-title { background: #252525; color: #EDE6D8; font-size: 13pt; font-weight: bold; padding: 10px; }
    .summary-head { background: #B3261E; color: #EDE6D8; font-weight: bold; }
    .detail-head { background: #B3261E; color: #EDE6D8; font-weight: bold; }
    .even { background: #F2F2F2; color: #242424; }
    .odd { background: #FFFFFF; color: #242424; }
  </style>
  <!--[if gte mso 9]><xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Reporte</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml><![endif]-->
</head>
<body>
  <table>
    <tr><td class="report-title" colspan="4">Reporte de métricas — ${escapeHtml(game.title)}</td></tr>
    <tr><td class="report-date" colspan="4">Fecha del reporte: ${escapeHtml(reportDate)}</td></tr>
  </table>
  <table>
    <tr><th class="section-title" colspan="2">Resumen Ejecutivo del Prototipo</th></tr>
    <tr><th class="summary-head">Métrica</th><th class="summary-head">Valor</th></tr>
    ${summaryRows}
  </table>
  <table>
    <tr><th class="section-title" colspan="4">Desglose Detallado por Pregunta</th></tr>
    <tr>
      <th class="detail-head">Pregunta</th>
      <th class="detail-head">Tipo de Pregunta</th>
      <th class="detail-head">Promedio / Resumen</th>
      <th class="detail-head">Comentarios Recibidos</th>
    </tr>
    ${questionRows || '<tr class="even"><td colspan="4">No hay respuestas para mostrar.</td></tr>'}
  </table>
</body>
</html>`
    const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const safeTitle = (game.title || '').trim().replace(/[^a-z0-9_-]+/gi, '-') || `juego-${gameId}`
    link.href = url
    link.download = `reporte-${safeTitle}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    notify('Reporte Excel descargado correctamente')
  }

  if (loading) {
    return <main className="content-shell dashboard-container"><p className="status-message">Cargando métricas...</p></main>
  }
  if (error) {
    return <main className="content-shell dashboard-container"><p className="error-message">{error}</p></main>
  }

  return (
    <main className="content-shell dashboard-container">
      <section className="page-heading">
        <div className="dashboard-heading-content">
          <div>
            <span className="eyebrow">DASHBOARD DEL PROTOTIPO</span>
            <h1>Métricas y estadísticas</h1>
            <p>Analiza el feedback recibido de tus playtesters.</p>
          </div>
          <button type="button" className="button secondary export-csv-button" onClick={exportExcelReport}>
            Exportar Reporte Excel (.xls)
          </button>
        </div>
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
