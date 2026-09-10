import { createContext, useContext } from 'react'
import type { AuthUser } from '../types/auth'

export type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  register: (name: string, email: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}