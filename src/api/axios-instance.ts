import axios from 'axios'

export const TOKEN_KEY = 'access_token'
export const REFRESH_TOKEN_KEY = 'refresh_token'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:5000',
})

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default axiosInstance