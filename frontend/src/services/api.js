import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('rbac-token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('rbac-token')
    delete api.defaults.headers.common.Authorization
  }
}

const savedToken = localStorage.getItem('rbac-token')
if (savedToken) api.defaults.headers.common.Authorization = `Bearer ${savedToken}`

export default api