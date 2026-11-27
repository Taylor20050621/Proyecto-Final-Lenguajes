import { useEffect, useState } from 'react'
import { getCurrentUser } from '../services/AuthService'
import { getLeaderboard } from '../services/UserService'
import '../styles/Leaderboard.css'

const medals = {
  1: 'Oro',
  2: 'Plata',
  3: 'Bronce',
}

export default function LeaderboardPage() {
  const [testers, setTesters] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const currentUser = getCurrentUser()

  useEffect(() => {
    getLeaderboard()
      .then(setTesters)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const podium = testers.slice(0, 3)
  const remaining = testers.slice(3)

  return (
    <main className="content-shell leaderboard-page">
      <section className="page-heading">
        <span className="eyebrow">COMUNIDAD PLAYTESTING</span>
        <h1>Ranking Testers</h1>
        <p>Reconocemos a quienes ayudan a que los próximos juegos indie sean mejores.</p>
      </section>
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="status-message">Cargando clasificación...</p>}
      {!loading && !error && testers.length === 0 && (
        <p className="status-message">Todavía no hay testers en la clasificación.</p>
      )}
      {!loading && !error && testers.length > 0 && (
        <>
          <section className="leaderboard-podium" aria-label="Podio de los tres mejores testers">
            {podium.map((tester, index) => {
              const place = index + 1
              return (
                <article
                  className={`podium-card podium-place-${place}${tester.username === currentUser?.username ? ' current-tester' : ''}`}
                  key={tester.id}
                >
                  <span className={`podium-medal medal-${place}`} aria-label={`Medalla de ${medals[place]}`}>
                    {place}
                  </span>
                  <span className="podium-place">{medals[place]}</span>
                  <h2>{tester.username}</h2>
                  <strong className="podium-points">{tester.points} pts</strong>
                  <span className="podium-rank">{tester.rank}</span>
                  <span className="podium-evaluations">{tester.evaluationsCount} evaluaciones</span>
                </article>
              )
            })}
          </section>
          {remaining.length > 0 && (
            <section className="leaderboard-table-section">
              <h2>Puestos 4 al 10</h2>
              <div className="leaderboard-table-wrap">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th scope="col">Puesto</th>
                      <th scope="col">Tester</th>
                      <th scope="col">Rango</th>
                      <th scope="col">Evaluaciones</th>
                      <th scope="col">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remaining.map((tester, index) => (
                      <tr className={tester.username === currentUser?.username ? 'current-tester' : ''} key={tester.id}>
                        <td>{index + 4}</td>
                        <td>{tester.username}</td>
                        <td>{tester.rank}</td>
                        <td>{tester.evaluationsCount}</td>
                        <td>{tester.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}
