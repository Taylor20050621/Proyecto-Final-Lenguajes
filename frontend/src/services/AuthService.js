import { API_URL, requestJson } from './apiClient'

const TOKEN_KEY = 'playtesting_jwt'
const USER_KEY = 'playtesting_user'
const READ_NOTIFICATIONS_PREFIX = 'playtesting_read_notifications:'

export function login(identifier, password) {
  return requestJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  }, 'No se pudo iniciar sesión. Inténtalo nuevamente.', {
    network: 'No se pudo conectar con el servidor. Verifica que el backend esté activo e inténtalo de nuevo.',
    statusMessages: { 401: 'Usuario, correo o contraseña incorrectos.' },
  }).then((data) => {
    saveSession(data)
    return data
  })
}

export function register(username, email, password, role) {
  return requestJson(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password, role }),
  }, 'No se pudo crear la cuenta. Inténtalo nuevamente.').then((data) => {
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
  window.location.replace('/')
}

export async function getMyProfile() {
  const payload = await requestJson(`${API_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }, 'No se pudo cargar el perfil.')
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: payload.username,
    role: payload.role,
    points: payload.points,
  }))
  return payload
}

export function getMyNotifications() {
  return requestJson(`${API_URL}/api/users/me/notifications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }, 'No se pudieron cargar las notificaciones.')
}
