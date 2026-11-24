import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/AuthService'
import '../styles/Forms.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.identifier, form.password)
      navigate('/catalog')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-card">
        <span className="eyebrow">BIENVENIDO DE VUELTA</span>
        <h1>Iniciar sesión</h1>
        <p className="muted">Ingresa para continuar con tus playtests.</p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="identifier">Usuario o email</label>
          <input id="identifier" name="identifier" value={form.identifier} onChange={updateField} required />
          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 3l18 18" />
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                  <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.3 0 9 7 9 7a16 16 0 0 1-3 3.7" />
                  <path d="M6.2 6.2C3.9 7.7 3 12 3 12s3.7 7 9 7a9 9 0 0 0 3-.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="form-footer">¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </section>
    </main>
  )
}
