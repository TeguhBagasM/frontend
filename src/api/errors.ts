import axios from 'axios'

/** Error API berbentuk `{ message, status?, errors? }` yang dilempar keluar
 *  dari axiosInstance. Komponen catch `ApiError` dan menampilkan `message`. */
export class ApiError extends Error {
  status: number
  errors?: Array<{ path: string; message: string }>

  constructor(status: number, message: string, errors?: Array<{ path: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

/** Menarik pesan yang bisa ditampilkan ke user dari error axios/unknown.
 *  Mem-parsing `{ success: false, message }` yang dikirim backend. */
export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan, coba lagi.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { success?: boolean; message?: string } | undefined
    if (data?.message) {
      return data.message
    }
    if (error.response) {
      return `Request gagal (status ${error.response.status}).`
    }
    if (error.code === 'ECONNABORTED') {
      return 'Waktu permintaan habis, coba lagi.'
    }
    if (!error.request) {
      return 'Terjadi kesalahan validasi pada aplikasi.'
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}

/** True kalau status HTTPnya 409. */
export function isConflict(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 409
  }
  return false
}

/** Mengambil daftar { path, message } dari body error validasi zod backend. */
export function getValidationErrors(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return []
  }
  const data = error.response?.data as { errors?: Array<{ path: string; message: string }> } | undefined
  return data?.errors ?? []
}

/** Menormalkan error apa pun (axios error, ApiError, Error) jadi ApiError
 *  agar consumer cukup baca `error.message` untuk pesan dari backend. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { success?: boolean; message?: string; errors?: Array<{ path: string; message: string }> }
      | undefined
    return new ApiError(
      error.response?.status ?? 500,
      data?.message ?? error.message,
      data?.errors,
    )
  }
  if (error instanceof Error) {
    return new ApiError(500, error.message)
  }
  return new ApiError(500, 'Terjadi kesalahan yang tidak dikenal.')
}