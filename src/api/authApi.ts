import axiosInstance from './axios-instance'
import { toApiError } from './errors'
import type { ApiSuccessResponse } from '../types/api'
import type {
  LoginCredentials,
  LoginResponse,
  MeResponse,
  RegisterInput,
} from '../types/auth'

const BASE = '/api/auth'
const USERS_BASE = '/api/users'

export async function login(email: string, password: string): Promise<LoginResponse> {
  const body: LoginCredentials = { email, password }
  try {
    const { data } = await axiosInstance.post<ApiSuccessResponse<LoginResponse>>(`${BASE}/login`, body)
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function register(name: string, email: string): Promise<void> {
  const body: RegisterInput = { name, email }
  try {
    await axiosInstance.post(`${BASE}/register`, body)
  } catch (error) {
    throw toApiError(error)
  }
}

/** Panggil dengan access token valid (dilampirkan otomatis oleh interceptor). */
export async function getMe(): Promise<MeResponse> {
  try {
    const { data } = await axiosInstance.get<ApiSuccessResponse<MeResponse>>(`${USERS_BASE}/me`)
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

/** Logout — revoke refresh token di server. Refresh token dikirim via body. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await axiosInstance.post(`${BASE}/logout`, { refreshToken })
  } catch (error) {
    throw toApiError(error)
  }
}