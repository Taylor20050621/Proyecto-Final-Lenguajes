const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const TOKEN_KEY = 'playtesting_jwt'
const USER_KEY = 'playtesting_user'
const READ_NOTIFICATIONS_PREFIX = 'playtesting_read_notifications:'

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
    points: data.points ?? 0,
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

function getReadNotificationsKey(username = getCurrentUser()?.username) {
  return username ? `${READ_NOTIFICATIONS_PREFIX}${username}` : null
}

function getNotificationKey(notification) {
  return `${notification.gameId}:${notification.version}:${notification.updatedAt || ''}`
}

export function getReadNotificationKeys() {
  const key = getReadNotificationsKey()
  if (!key) return []

  try {
    const stored = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    localStorage.removeItem(key)
    return []
  }
}

export function getUnreadNotifications(notifications) {
  const readKeys = new Set(getReadNotificationKeys())
  return notifications.filter((notification) => !readKeys.has(getNotificationKey(notification)))
}

export function markNotificationsAsRead(notifications) {
  const key = getReadNotificationsKey()
  if (!key || !notifications.length) return

  const readKeys = new Set(getReadNotificationKeys())
  notifications.forEach((notification) => readKeys.add(getNotificationKey(notification)))
  localStorage.setItem(key, JSON.stringify([...readKeys]))
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.location.assign('/login')
}

export async function getMyProfile() {
  const response = await fetch(`${API_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'No se pudo cargar el perfil.')
  }
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: payload.username,
    role: payload.role,
    points: payload.points,
  }))
  return payload
}

export async function getMyNotifications() {
  const response = await fetch(`${API_URL}/api/users/me/notifications`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'No se pudieron cargar las notificaciones.')
  }
  return payload
}
