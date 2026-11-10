import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/AuthService'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'TESTER' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password, form.role)
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
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Nombre de usuario</label>
          <input id="username" name="username" value={form.username} onChange={updateField} minLength="3" maxLength="50" required />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={updateField} required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" value={form.password} minLength="8" maxLength="72" onChange={updateField} required />
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
