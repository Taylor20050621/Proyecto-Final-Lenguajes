import { getToken } from './AuthService'
import { API_URL, fetchApi, NETWORK_ERROR_MESSAGE, requestJson } from './apiClient'

export function getGameCoverUrl(gameId) {
  return `${API_URL}/api/games/${gameId}/cover`
}

function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getGames({ search = '', platform = '', status = '' } = {}) {
  const query = new URLSearchParams()
  if (search.trim()) query.set('search', search.trim())
  if (platform) query.set('platform', platform)
  if (status) query.set('status', status)
  const queryString = query.toString()
  return requestJson(`${API_URL}/api/games${queryString ? `?${queryString}` : ''}`, {
    headers: authHeaders(),
  }, 'No se pudo cargar el catálogo.')
}

export function getGameById(id) {
  return requestJson(`${API_URL}/api/games/${id}`, {}, 'No se pudo cargar el juego.')
}

export function updateGameFile(id, version, file, releaseNotes = null, coverImage = null) {
  const formData = new FormData()
  formData.append('version', version)
  formData.append('file', file)
  if (releaseNotes !== null) formData.append('releaseNotes', releaseNotes)
  if (coverImage) formData.append('coverImage', coverImage)
  return requestJson(`${API_URL}/api/games/${id}/update-file`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
    isMultipart: true,
  }, 'No se pudo actualizar la versión.')
}

export async function downloadGame(id) {
  const response = await fetchApi(`${API_URL}/api/games/${id}/download`, {
    headers: authHeaders(),
  })

  let blob
  try {
    blob = await response.blob()
  } catch (error) {
    if (error instanceof TypeError || /network|fetch/i.test(error?.message || '')) {
      throw new Error(NETWORK_ERROR_MESSAGE)
    }
    throw error
  }
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return {
    blob,
    filename: filenameMatch?.[1] || `prototipo-${id}`,
  }
}

export function createGame({ title, description, genre, platform, file, coverImage, releaseNotes }) {
  const formData = new FormData()
  formData.append(
    'game',
    new Blob([JSON.stringify({ title, description, genre, platform, releaseNotes })], {
      type: 'application/json',
    }),
  )
  formData.append('file', file)
  if (coverImage) formData.append('coverImage', coverImage)

  return requestJson(`${API_URL}/api/games`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
    isMultipart: true,
  }, 'No se pudo publicar el juego.')
}

export function updateGameStatus(id, status, officialUrl) {
  return requestJson(`${API_URL}/api/games/${id}/status`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status, officialUrl }),
  }, 'No se pudo actualizar el estado del juego.')
}
