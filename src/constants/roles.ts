export const ROLES = {
  ADMIN: 'Admin',
  VERIFIKATOR: 'Verifikator',
  SELEKSI: 'Lembaga Seleksi',
  CALON_PESERTA: 'Calon Peserta',
} as const

export type RoleName = (typeof ROLES)[keyof typeof ROLES]