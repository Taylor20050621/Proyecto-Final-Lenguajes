import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../services/AuthService'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
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
          <input id="password" name="password" type="password" value={form.password} onChange={updateField} required />
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
