import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, login as loginApi, logout as logoutApi, register as registerApi } from '../api/authApi'
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '../api/axios-instance'
import { ROLES } from '../constants/roles'
import { AuthContext } from './AuthContext'
import type { RoleName } from '../constants/roles'
import type { AuthUser, MeResponse } from '../types/auth'

function isRoleName(name: string): name is RoleName {
  return (Object.values(ROLES) as readonly string[]).includes(name)
}

/** Petakan respons GET /users/me ke bentuk user frontend (roleName + menus). */
function toAuthUser(me: MeResponse): AuthUser {
  return {
    id: me.id,
    name: me.name,
    email: me.email,
    roleName: me.role?.name && isRoleName(me.role.name) ? me.role.name : null,
    menus: me.role?.menus ?? [],
  }
}

function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session dari localStorage kalau ada access token tersimpan.
  useEffect(() => {
    let cancelled = false

    async function restore() {
      const storedAccess = localStorage.getItem(TOKEN_KEY)
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!storedAccess) {
        setIsLoading(false)
        return
      }
      try {
        const me = await getMe()
        if (cancelled) return
        setAccessToken(storedAccess)
        setRefreshToken(storedRefresh)
        setUser(toAuthUser(me))
      } catch {
        if (cancelled) return
        clearStoredTokens()
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const res = await loginApi(email, password)
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken)
    const me = await getMe()
    const mapped = toAuthUser(me)
    setAccessToken(res.accessToken)
    setRefreshToken(res.refreshToken)
    setUser(mapped)
    return mapped
  }, [])

  const register = useCallback(async (name: string, email: string): Promise<void> => {
    await registerApi(name, email)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken)
      }
    } catch {
      // Refresh token sudah invalid di server? Tetap bersihkan sesi lokal.
    } finally {
      clearStoredTokens()
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
    }
  }, [refreshToken])

  return (
    <AuthContext.Provider
      value={{ user, accessToken, refreshToken, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}