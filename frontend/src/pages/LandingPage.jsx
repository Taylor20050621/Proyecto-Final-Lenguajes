import { Link } from 'react-router-dom'
import { getCurrentUser, isAuthenticated } from '../services/AuthService'
import '../styles/LandingPage.css'

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function StudioIcon({ type }) {
  const paths = {
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    survey: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h5M8 16h7" /></>,
    feedback: <><path d="M4 5h16v11H8l-4 4z" /><path d="m8 10 2 2 5-5" /></>,
    dashboard: <><path d="M4 19V5M4 19h16" /><path d="m7 15 3-4 3 2 5-7" /></>,
  }
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

export default function LandingPage() {
  const authenticated = isAuthenticated()
  const user = getCurrentUser()

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">INDIE GAME STUDIO / PLAYTESTING 2.0</span>
          <h1>De prototipo prometedor a juego inolvidable.</h1>
          <p>La plataforma donde los creadores validan sus ideas y los testers ayudan a darles vida con feedback accionable.</p>
          <div className="hero-actions">
            {authenticated ? (
              <Link className="button primary" to="/catalog">Ir al Catálogo <ArrowIcon /></Link>
            ) : (
              <>
                <Link className="button primary" to="/register">Unirse como Tester <ArrowIcon /></Link>
                <Link className="button secondary" to="/register">Publicar mi Prototipo <ArrowIcon /></Link>
              </>
            )}
          </div>
          {authenticated && <span className="landing-welcome">Bienvenido de nuevo, {user?.username}.</span>}
        </div>
        <div className="dashboard-mockup" aria-label="Vista previa del dashboard de métricas">
          <div className="mockup-topbar"><span /><span /><span /><b>INSIGHT LAB</b></div>
          <div className="mockup-content">
            <div className="mockup-heading"><div><small>OVERVIEW / PROTOTYPE</small><strong>Neon Odyssey</strong></div><em>v1.1</em></div>
            <div className="mockup-kpis"><div><small>PLAYTESTS</small><strong>128</strong></div><div><small>SATISFACTION</small><strong>4.9</strong></div></div>
            <div className="mockup-chart">
              <div className="chart-label"><small>PLAYER SENTIMENT</small><strong>87%</strong></div>
              <svg viewBox="0 0 280 72" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8b5cf6" stopOpacity=".5" /><stop offset="1" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
                <path d="M0 62 C28 56 34 48 58 51 S88 30 112 39 S145 24 166 32 S198 12 220 20 S254 7 280 10 V72 H0Z" fill="url(#chartFill)" />
                <path d="M0 62 C28 56 34 48 58 51 S88 30 112 39 S145 24 166 32 S198 12 220 20 S254 7 280 10" fill="none" stroke="#a78bfa" strokeWidth="2" />
              </svg>
            </div>
            <div className="mockup-bottom"><div><small>CORE LOOP</small><div className="progress"><span style={{ width: '82%' }} /></div></div><div className="stars">★★★★★ <small>4.9 / 5</small></div></div>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div><strong>+250</strong><span>Prototipos Indie</span></div>
        <div><strong>+5,000</strong><span>Playtests Completados</span></div>
        <div><strong>4.9/5</strong><span>Satisfacción de Creadores</span></div>
      </section>

      <section className="landing-flow">
        <div className="landing-section-heading"><span className="eyebrow">WORKFLOW</span><h2>De la idea al insight en cuatro pasos.</h2></div>
        <div className="flow-grid">
          {[
            ['upload', '01', 'Sube tu prototipo', '.zip, .exe, .pdf y listo para probar.'],
            ['survey', '02', 'Diseña tu encuesta', 'Likert, numérica o texto libre.'],
            ['feedback', '03', 'Recibe feedback', 'Gamificación para motivar testers.'],
            ['dashboard', '04', 'Mide y evoluciona', 'Dashboard y versiones v1.0 → v1.1.'],
          ].map(([icon, number, title, description]) => (
            <article className="flow-step" key={number}><span className="flow-number">{number}</span><div className="flow-icon"><StudioIcon type={icon} /></div><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="landing-showcase">
        <article className="showcase-card creator-showcase"><div className="showcase-icon"><StudioIcon type="dashboard" /></div><span className="eyebrow">PARA CREADORES</span><h2>Decide con datos, no con suposiciones.</h2><p>Visualiza métricas de tus jugadores, compara versiones y encuentra el próximo gran ajuste de tu juego.</p><div className="mini-bars"><span style={{ width: '88%' }} /><span style={{ width: '64%' }} /><span style={{ width: '76%' }} /></div></article>
        <article className="showcase-card tester-showcase"><div className="showcase-icon"><StudioIcon type="feedback" /></div><span className="eyebrow">PARA TESTERS</span><h2>Tu feedback desbloquea mundos.</h2><p>Prueba experiencias únicas, gana puntos y deja una huella real en los juegos que están por llegar.</p><div className="showcase-rating"><strong>★★★★★</strong><span>+50 pts por evaluación</span></div></article>
      </section>
    </main>
  )
}
