import { getToken } from './AuthService'
import { API_URL, requestJson } from './apiClient'

export function getLeaderboard() {
  const token = getToken()
  return requestJson(`${API_URL}/api/users/leaderboard`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }, 'No se pudo cargar el ranking.')
}
