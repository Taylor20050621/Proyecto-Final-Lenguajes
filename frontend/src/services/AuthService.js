const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const TOKEN_KEY = 'playtesting_jwt'
const USER_KEY = 'playtesting_user'

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
    saveSession(data)
    return data
  })
}

export function register(username, email, password, role) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, role }),
  }).then((data) => {
    saveSession(data)
    return data
  })
}

function saveSession(data) {
  saveToken(data.jwtToken)
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: data.username,
    role: data.role,
  }))
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

export function getCurrentUser() {
  const storedUser = localStorage.getItem(USER_KEY)
  if (storedUser) {
    try {
      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem(USER_KEY)
    }
  }

  const token = getToken()
  if (!token) {
    return null
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return { username: payload.sub, role: payload.role }
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.assign('/login')
}
