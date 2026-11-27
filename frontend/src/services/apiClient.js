export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const NETWORK_ERROR_MESSAGE =
  'No se pudo conectar con el servidor. Verifica que el servidor esté encendido o revisa tu conexión a internet.'
export const UPLOAD_ERROR_MESSAGE =
  'No se pudo subir el archivo. Verifica que no supere el límite máximo de 4 GB y que tu conexión sea estable.'

const statusMessages = {
  400: 'La solicitud contiene datos inválidos. Revisa la información e inténtalo de nuevo.',
  401: 'Tu sesión ha expirado o las credenciales son incorrectas.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'No se encontró el recurso solicitado.',
  409: 'La solicitud entra en conflicto con el estado actual. Revisa los datos e inténtalo de nuevo.',
  413: 'La solicitud es demasiado grande. Reduce la cantidad de datos e inténtalo de nuevo.',
  500: 'Ocurrió un error interno al procesar tu solicitud. Inténtalo nuevamente.',
}

function isGenericEnglishMessage(message) {
  const normalized = String(message || '').trim().toLowerCase()
  return !normalized
    || /^(failed to fetch|networkerror|network error|load failed|fetch failed|bad request|unauthorized|forbidden|not found|conflict|payload too large|internal server error|request failed)(\.|$)/i.test(normalized)
    || /\b(networkerror|network error|failed to fetch|load failed|fetch failed)\b/i.test(normalized)
    || /^\d{3}\s+(bad request|unauthorized|forbidden|not found|conflict|payload too large|request entity too large|internal server error)/i.test(normalized)
    || /\b(access denied|request entity too large|entity too large|invalid credentials)\b/i.test(normalized)
    || /(?:exception|stack trace|whitelabel error page|servlet exception)/i.test(normalized)
    || /<(!doctype|html|body)\b/i.test(normalized)
    || (/\b(the|is|are|was|were|not|failed|required|invalid|must|cannot|could|please|request|response|error|exception|only|already|exceeds|maximum)\b/i.test(normalized)
      && !/(?:[áéíóúñ¿¡]|\b(el|la|los|las|un|una|unos|unas|de|del|no|para|por|con|tu|tus|debes|ingresa|selecciona|archivo|juego|formulario|contraseña|correo|usuario|solicitud|pregunta|evaluación|válido|válida)\b)/i.test(normalized))
}

async function extractResponseMessage(response) {
  const body = await response.text()
  if (!body) return ''

  try {
    const payload = JSON.parse(body)
    return payload?.message || payload?.detail || payload?.error || ''
  } catch {
    return /<(!doctype|html|body)\b/i.test(body) ? '' : body
  }
}

function isNetworkError(error) {
  return error instanceof TypeError || /network|fetch/i.test(error?.message || '')
}

function isFormData(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData
}

export async function fetchApi(url, options = {}, errorMessages = {}) {
  const { isMultipart: explicitMultipart, ...fetchOptions } = options
  const isMultipart = explicitMultipart ?? isFormData(fetchOptions.body)
  const networkErrorMessage = errorMessages.network
    || (isMultipart ? UPLOAD_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE)
  let response
  try {
    response = await fetch(url, fetchOptions)
  } catch (error) {
    if (isNetworkError(error)) {
      throw new Error(networkErrorMessage)
    }
    throw error
  }

  if (!response.ok) {
    let message
    try {
      message = await extractResponseMessage(response)
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error(networkErrorMessage)
      }
      message = ''
    }
    if (isMultipart && response.status === 413) {
      throw new Error(UPLOAD_ERROR_MESSAGE)
    }
    const customStatusMessage = errorMessages.statusMessages?.[response.status]
    if (customStatusMessage) {
      throw new Error(customStatusMessage)
    }
    const statusMessage = statusMessages[response.status]
      || 'No se pudo completar la solicitud. Inténtalo de nuevo.'
    throw new Error(isGenericEnglishMessage(message) ? statusMessage : message)
  }

  return response
}

export async function requestJson(url, options = {}, fallbackMessage = 'No se pudo completar la solicitud.', errorMessages = {}) {
  const response = await fetchApi(url, options, errorMessages)
  try {
    return await response.json()
  } catch {
    throw new Error(fallbackMessage)
  }
}
