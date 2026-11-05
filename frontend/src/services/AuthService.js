const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const TOKEN_KEY = 'playtesting_jwt'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'No se pudo completar la solicitud.')
  }
  return payload
}

export function login(identifier, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  }).then((data) => {
    saveToken(data.jwtToken)
    return data
  })
}

export function register(username, email, password, role) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role }),
  }).then((data) => {
    saveToken(data.jwtToken)
    return data
  })
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  window.location.assign('/')
}
