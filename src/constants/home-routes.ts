import { ROLES } from './roles'

/** Halaman tujuan setelah login sukses, dipetakan per role. */
export const HOME_BY_ROLE: Record<string, string> = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.CALON_PESERTA]: '/applicant/beasiswa',
  [ROLES.VERIFIKATOR]: '/verifikator/list',
  [ROLES.SELEKSI]: '/lembaga-seleksi/list',
}

export const DEFAULT_HOME = '/'

export function homeForRole(roleName: string | null): string {
  return roleName ? (HOME_BY_ROLE[roleName] ?? DEFAULT_HOME) : DEFAULT_HOME
}