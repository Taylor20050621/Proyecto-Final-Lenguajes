import { getToken } from './AuthService'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function parseError(response) {
  const payload = await response.json().catch(() => null)
  return payload?.message || payload?.error || 'No se pudo completar la solicitud.'
}

export async function getGames({ search = '', platform = '' } = {}) {
  const query = new URLSearchParams()
  if (search.trim()) query.set('search', search.trim())
  if (platform) query.set('platform', platform)
  const queryString = query.toString()
  const response = await fetch(`${API_URL}/api/games${queryString ? `?${queryString}` : ''}`)
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function updateGameFile(id, version, file) {
  const formData = new FormData()
  formData.append('version', version)
  formData.append('file', file)
  const response = await fetch(`${API_URL}/api/games/${id}/update-file`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}

export async function downloadGame(id) {
  const response = await fetch(`${API_URL}/api/games/${id}/download`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return {
    blob,
    filename: filenameMatch?.[1] || `prototipo-${id}`,
  }
}

export async function createGame({ title, description, genre, platform, file }) {
  const formData = new FormData()
  formData.append(
    'game',
    new Blob([JSON.stringify({ title, description, genre, platform })], {
      type: 'application/json',
    }),
  )
  formData.append('file', file)

  const response = await fetch(`${API_URL}/api/games`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return response.json()
}
