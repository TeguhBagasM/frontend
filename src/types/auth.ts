import type { RoleName } from '../constants/roles'

export type RoleMenu = {
  id: number
  name: string
  path: string
  canRead: boolean
  canWrite: boolean
}

export type AuthUser = {
  id: number
  name: string
  email: string
  roleName: RoleName | null
  menus: RoleMenu[]
}

export type LoginCredentials = {
  email: string
  password: string
}

export type RegisterInput = {
  name: string
  email: string
}

/** Respons POST /auth/login — user-nya bentuk ringkas (tanpa menus),
 *  frontend lalu panggil /users/me untuk profil lengkap. */
export type LoginResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: number
    name: string
    email: string
    roleId: number | null
    isInternal: boolean
    createdAt: string
  }
}

/** Respons GET /users/me — berisi role + akses menu. */
export type MeResponse = {
  id: number
  name: string
  email: string
  roleId: number | null
  isActive: boolean
  isInternal: boolean
  createdAt: string
  role: {
    name: string
    menus: RoleMenu[]
  } | null
}