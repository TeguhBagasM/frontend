import axios from 'axios'
import axiosInstance from './axios-instance'
import { ApiError } from './errors'
import type {
  ApiSuccessResponse,
} from '../types/api'
import type {
  CreateDraftResult,
  DashboardStatistik,
  DataDiri,
  LatarBelakang,
  Pendaftaran,
  PendaftaranDetail,
  PendaftaranListQuery,
  PendaftaranListResult,
  SubmitVerifikasiPayload,
  SubmitPenilaianPayload,
  UpdateDraftPayload,
  Verifikasi,
  VerifikasiKeputusanResult,
  Wawancara,
  WawancaraPenilaianResult,
} from '../types/pendaftaran'

const BASE = '/api/transaksi'

/** Error khusus kalau createDraft kena 409 (sudah ada draft aktif).
 *  Komponen catch ini untuk redirect ke detail draft yang sudah ada,
 *  bukan cuma menampilkan pesan error generik. */
export class DuplicateDraftError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DuplicateDraftError'
  }
}

/** Error khusus kalau submitFinal kena 400 (data belum lengkap). */
export class IncompleteSubmissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'IncompleteSubmissionError'
  }
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { success?: boolean; message?: string } | undefined
    if (body?.message) {
      return body.message
    }
  }
  return fallback
}

function throwApiError(error: unknown, fallback: string): never {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { success?: boolean; message?: string } | undefined
    throw new ApiError(
      error.response?.status ?? 500,
      body?.message ?? fallback,
      (body as { errors?: Array<{ path: string; message: string }> } | undefined)?.errors,
    )
  }
  throw new ApiError(500, fallback)
}

export async function createDraft(beasiswaId: number): Promise<CreateDraftResult> {
  try {
    const { data } = await axiosInstance.post<ApiSuccessResponse<CreateDraftResult>>(`${BASE}/pendaftaran`, { beasiswaId })
    return data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new DuplicateDraftError(
        extractErrorMessage(error, 'Anda sudah memiliki pendaftaran aktif untuk beasiswa ini.'),
      )
    }
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const body = error.response.data as { message?: string } | undefined
      throw new ApiError(400, body?.message ?? 'Beasiswa tidak ditemukan atau data pendaftaran tidak valid.')
    }
    throwApiError(error, 'Gagal membuat pendaftaran.')
  }
}

export async function updateDraft(
  id: number,
  data: UpdateDraftPayload,
): Promise<{ pendaftaran: Pendaftaran; dataDiri: DataDiri | null; latarBelakang: LatarBelakang | null }> {
  try {
    const res = await axiosInstance.put<
      ApiSuccessResponse<{ pendaftaran: Pendaftaran; dataDiri: DataDiri | null; latarBelakang: LatarBelakang | null }>
    >(`${BASE}/pendaftaran/${id}`, data)
    return res.data.data
  } catch (error) {
    throwApiError(error, 'Gagal menyimpan pendaftaran.')
  }
}

export async function submitFinal(id: number): Promise<Pendaftaran> {
  try {
    const { data } = await axiosInstance.post<ApiSuccessResponse<Pendaftaran>>(`${BASE}/pendaftaran/${id}/submit`)
    return data.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      throw new IncompleteSubmissionError(
        extractErrorMessage(
          error,
          'Pendaftaran belum lengkap, field berikut wajib diisi terlebih dahulu.',
        ),
      )
    }
    throwApiError(error, 'Gagal mengirim pendaftaran.')
  }
}

export async function getMyPendaftaran(): Promise<PendaftaranDetail[]> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<PendaftaranDetail[]>>(`${BASE}/pendaftaran/my`)
  return data.data
}

export async function getPendaftaranById(id: number): Promise<PendaftaranDetail> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<PendaftaranDetail>>(`${BASE}/pendaftaran/${id}`)
  return data.data
}

/** Riwayat (array) catatan verifikasi untuk pendaftaran ini — dipakai menampilkan
 *  catatan revisi ke applicant. */
export async function getVerifikasiHistori(id: number): Promise<Verifikasi[]> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<Verifikasi[]>>(
    `${BASE}/pendaftaran/${id}/verifikasi/histori`,
  )
  return data.data
}

export async function getPendaftaranForVerifikasi(
  query?: PendaftaranListQuery,
): Promise<PendaftaranListResult> {
  const params: Record<string, string | number | undefined> = {
    status: 'under_review_admin',
    page: query?.page,
    perPage: query?.perPage,
    beasiswaId: query?.beasiswaId,
    search: query?.search,
  }
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value === undefined) {
      delete params[key]
    }
  })
  const { data } = await axiosInstance.get<ApiSuccessResponse<PendaftaranListResult>>(
    `${BASE}/pendaftaran`,
    { params },
  )
  return data.data
}

/** Kirim keputusan verifikator. Status verifikasi (`disetujui`/`ditolak`/`revisi`)
 *  di-backend dipetakan ke status pendaftaran (lolos_admin/ditolak_admin/revisi_diminta). */
export async function submitVerifikasi(
  id: number,
  payload: SubmitVerifikasiPayload,
): Promise<VerifikasiKeputusanResult> {
  const { data } = await axiosInstance.post<ApiSuccessResponse<VerifikasiKeputusanResult>>(
    `${BASE}/pendaftaran/${id}/verifikasi`,
    payload,
  )
  return data.data
}

export async function getPendaftaranForWawancara(): Promise<PendaftaranDetail[]> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<PendaftaranDetail[]>>(
    `${BASE}/pendaftaran/wawancara`,
  )
  return data.data
}

export async function submitPenilaianWawancara(
  id: number,
  payload: SubmitPenilaianPayload,
): Promise<WawancaraPenilaianResult> {
  const { data } = await axiosInstance.post<ApiSuccessResponse<WawancaraPenilaianResult>>(
    `${BASE}/pendaftaran/${id}/wawancara`,
    payload,
  )
  return data.data
}

export async function getDashboardStatistik(): Promise<DashboardStatistik> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<DashboardStatistik>>(
    `${BASE}/dashboard/statistik`,
  )
  return data.data
}

/** Data mentah untuk export Excel — semua pendaftaran status lulus_wawancara. */
export async function getHasilFinal(): Promise<Array<PendaftaranDetail & { wawancara?: Wawancara[] }>> {
  const { data } = await axiosInstance.get<ApiSuccessResponse<Array<PendaftaranDetail & { wawancara?: Wawancara[] }>>>(
    `${BASE}/dashboard/hasil-final`,
  )
  return data.data
}