import { getToken } from './AuthService'
import { API_URL, requestJson } from './apiClient'

function request(path, options = {}, fallbackMessage = 'No se pudo completar la solicitud.') {
  const token = getToken()
  return requestJson(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  }, fallbackMessage)
}

export function getActiveForm(gameId) {
  return request(`/api/forms/game/${gameId}`, {}, 'No se pudo cargar el formulario.')
}

export function getFormByGameId(gameId) {
  return getActiveForm(gameId)
}

export function createForm(gameId, form) {
  return request(`/api/forms?gameId=${gameId}`, {
    method: 'POST',
    body: JSON.stringify(form),
  }, 'No se pudo crear el formulario.')
}

export function submitFeedback(formId, answers) {
  return request('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ formId, answers }),
  }, 'No se pudo enviar la evaluación.')
}

export function getFeedback(gameId) {
  return request(`/api/feedback/game/${gameId}`, {}, 'No se pudieron cargar las evaluaciones.')
}

export function getFeedbackSummary(gameId) {
  return request(`/api/feedback/game/${gameId}/summary`, {}, 'No se pudo cargar el resumen de evaluaciones.')
}
