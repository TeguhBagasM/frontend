import axiosInstance from './axios-instance'
import { toApiError } from './errors'
import type { ApiSuccessResponse } from '../types/api'
import type { ActiveBeasiswaResult, BeasiswaDetail, Persyaratan } from '../types/beasiswa'

const BASE = '/api/master'

export type ActiveBeasiswaParams = {
  page?: number
  limit?: number
  search?: string
}

export async function getActiveBeasiswa(params: ActiveBeasiswaParams = {}): Promise<ActiveBeasiswaResult> {
  const query = {
    page: params.page,
    limit: params.limit,
    search: params.search,
  }
  for (const key of Object.keys(query) as Array<keyof typeof query>) {
    if (query[key] === undefined) {
      delete query[key]
    }
  }
  try {
    const { data } = await axiosInstance.get<ApiSuccessResponse<ActiveBeasiswaResult>>(`${BASE}/beasiswa`, {
      params: query,
    })
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getBeasiswaById(id: number): Promise<BeasiswaDetail> {
  try {
    const { data } = await axiosInstance.get<ApiSuccessResponse<BeasiswaDetail>>(`${BASE}/beasiswa/${id}`)
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getPersyaratan(beasiswaId: number): Promise<Persyaratan[]> {
  try {
    const { data } = await axiosInstance.get<ApiSuccessResponse<Persyaratan[]>>(
      `${BASE}/persyaratan/beasiswa/${beasiswaId}/persyaratan`,
    )
    return data.data
  } catch (error) {
    throw toApiError(error)
  }
}