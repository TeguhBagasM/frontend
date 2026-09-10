export type Beasiswa = {
  id: number
  nama: string
  deskripsi: string
  kuota: number
  tanggalBuka: string
  tanggalTutup: string
  statusAktif: boolean
  createdAt: string
  updatedAt: string
}

export type Persyaratan = {
  id: number
  beasiswaId: number
  namaDokumen: string
  wajib: boolean
  createdAt: string
}

export type PersyaratanRingkas = {
  id: number
  namaDokumen: string
  wajib: boolean
}

export type BeasiswaDetail = Beasiswa & {
  persyaratan: PersyaratanRingkas[]
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ActiveBeasiswaResult = {
  data: Beasiswa[]
  pagination: Pagination
}