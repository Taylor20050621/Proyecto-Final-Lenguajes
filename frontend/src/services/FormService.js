import { getToken } from './AuthService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'No se pudo completar la solicitud.')
  }
  return payload
}

export function getActiveForm(gameId) {
  return request(`/api/forms/game/${gameId}`)
}

export function createForm(gameId, form) {
  return request(`/api/forms?gameId=${gameId}`, {
    method: 'POST',
    body: JSON.stringify(form),
  })
}

export function submitFeedback(formId, answers) {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ formId, answers }),
  })
}

export function getFeedback(gameId) {
  return request(`/api/feedback/game/${gameId}`)
}

export function getFeedbackSummary(gameId) {
  return request(`/api/feedback/game/${gameId}/summary`)
}
