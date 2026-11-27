import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/AuthService'
import '../styles/Forms.css'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'TESTER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const username = form.username.trim()
    const email = form.email.trim()
    if (!username || !email || !form.password.trim()) {
      setError('Completa todos los campos obligatorios.')
      return
    }
    if (username.length < 3 || username.length > 50) {
      setError('El nombre de usuario debe tener entre 3 y 50 caracteres.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }
    if (form.password.length < 8 || form.password.length > 72) {
      setError('La contraseña debe tener entre 8 y 72 caracteres.')
      return
    }
    if (!['TESTER', 'CREATOR'].includes(form.role)) {
      setError('Selecciona un tipo de cuenta válido.')
      return
    }
    setLoading(true)
    try {
      await register(username, email, form.password, form.role)
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
        <span className="eyebrow">ÚNETE A LA COMUNIDAD</span>
        <h1>Crear cuenta</h1>
        <p className="muted">Elige cómo quieres participar en el playtesting.</p>
        <form noValidate onSubmit={handleSubmit}>
          <label htmlFor="username">Nombre de usuario</label>
          <input id="username" name="username" value={form.username} onChange={updateField} minLength="3" maxLength="50" autoComplete="username" required />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={updateField} maxLength="255" autoComplete="email" required />
          <label htmlFor="password">Contraseña</label>
          <div className="password-field">
            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} minLength="8" maxLength="72" onChange={updateField} autoComplete="new-password" required />
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
          <label htmlFor="role">Quiero participar como</label>
          <select id="role" name="role" value={form.role} onChange={updateField}>
            <option value="TESTER">Playtester</option>
            <option value="CREATOR">Creador</option>
          </select>
          {error && <p className="error-message">{error}</p>}
          <button className="button primary full-width" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="form-footer">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </section>
    </main>
  )
}
