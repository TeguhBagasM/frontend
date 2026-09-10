import axios from 'axios'
import axiosInstance from './axios-instance'
import { getErrorMessage } from './errors'
import type { ApiSuccessResponse } from '../types/api'
import type { Dokumen, JenisDokumen } from '../types/dokumen'

const BASE = '/api/dokumen'

/** Error khusus untuk 409 saat delete — pendaftaran sudah bukan draft/revisi. */
export class DeleteForbiddenStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DeleteForbiddenStatusError'
  }
}

export async function uploadDokumen(
  pendaftaranId: number,
  jenisDokumen: JenisDokumen,
  file: File,
): Promise<Dokumen> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('pendaftaranId', String(pendaftaranId))
  formData.append('jenisDokumen', jenisDokumen)

  // Penting: JANGAN set header Content-Type secara manual di sini.
  // Axios harus mengisi header boundary otomatis untuk multipart/form-data.
  // Kalau di-set manual, boundary tidak akan dikirim dan multer
  // di backend akan menolak request dengan error parsing.
  try {
    const { data } = await axiosInstance.post<ApiSuccessResponse<Dokumen>>(
      `${BASE}/upload`,
      formData,
    )
    return data.data
  } catch (error) {
    // Pesan error sudah spesifik dari backend:
    // - 403: "Anda tidak memiliki akses untuk mengupload dokumen pada pendaftaran ini"
    // - 503: "Service Transaksi tidak dapat dihubungi. Tidak dapat memverifikasi kepemilikan."
    throw new Error(getErrorMessage(error, 'Gagal mengupload dokumen.'), { cause: error })
  }
}

export async function getDokumenByPendaftaran(pendaftaranId: number): Promise<Dokumen[]> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<Dokumen[]>>(
    `${BASE}/pendaftaran/${pendaftaranId}`,
  )
  return data.data
}

export type DokumenBlob = {
  blobUrl: string
  namaFileAsli: string
  mimeType: string
}

/**
 * Fetch file dokumen sebagai blob (bukan URL biasa).
 *
 * Kenapa harus blob, bukan URL langsung di <img src> / <a href>?
 *   Endpoint GET /dokumen/:id/file membutuhkan header Authorization: Bearer.
 *   Tag HTML seperti <img src>, <a href>, atau <object> tidak bisa mengirim
 *   header custom. Pendekatan alternatif (query token ?token=...) tidak tersedia
 *   di backend — semua autentikasi dilakukan via header bearer saja.
 *
 *   Strateginya:
 *   1. Fetch file dengan axiosInstance (request interceptor otomatis melampirkan token)
 *   2. Ambil response sebagai Blob
 *   3. Buat URL temporary via URL.createObjectURL
 *   4. URL ini bisa dipakai di <img src>, <a href>, atau <iframe src> tanpa masalah
 *      karena URL blob sudah bersifat "diproses" dan tidak perlu header
 *   5. URL blob harus dibersihkan via revokeObjectUrl setelah dipakai
 *      untuk mencegah memory leak
 *
 * @returns { blobUrl, namaFileAsli, mimeType } — gunakan blobUrl di src/href
 *         lalu panggil revokeFileBlobUrl() saat komponen unmount atau file tidak lagi ditampilkan.
 */
export async function fetchFileBlob(dokumenId: number): Promise<DokumenBlob> {
  const { data, headers } = await axiosInstance.get<Blob>(`${BASE}/${dokumenId}/file`, {
    responseType: 'blob',
  })

  const contentType = headers['content-type']
  const contentDisposition = headers['content-disposition']

  return {
    blobUrl: URL.createObjectURL(data),
    namaFileAsli: parseFilename(typeof contentDisposition === 'string' ? contentDisposition : undefined) ?? `dokumen-${dokumenId}`,
    mimeType: data.type || (typeof contentType === 'string' ? contentType : 'application/octet-stream'),
  }
}

function parseFilename(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) {
    return null
  }

  // Coba filename*=UTF-8''... dulu (RFC 5987) — support nama file Indonesia
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/"/g, ''))
  }

  // Fallback ke filename="..." biasa
  const plainMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i)
  return plainMatch?.[1]?.trim() ?? null
}

export function revokeFileBlobUrl(blobUrl: string): void {
  URL.revokeObjectURL(blobUrl)
}

export async function deleteDokumen(id: number): Promise<void> {
  try {
    await axiosInstance.delete(`${BASE}/${id}`)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new DeleteForbiddenStatusError(
        getErrorMessage(error, 'Dokumen hanya dapat dihapus saat pendaftaran berstatus draft atau revisi_diminta.'),
      )
    }
    throw new Error(getErrorMessage(error, 'Gagal menghapus dokumen.'), { cause: error })
  }
}