export type StatusPendaftaran =
  | 'draft'
  | 'submitted'
  | 'under_review_admin'
  | 'revisi_diminta'
  | 'ditolak_admin'
  | 'lolos_admin'
  | 'under_review_wawancara'
  | 'tidak_lulus_wawancara'
  | 'lulus_wawancara'

export type StatusVerifikasi = 'disetujui' | 'ditolak' | 'revisi'
export type StatusWawancara = 'lulus' | 'tidak_lulus'

export type DataDiri = {
  nik: string
  nama: string
  tglLahir: string
  alamat: string
  noHp1: string
  noHp2?: string
  email: string
}

export type LatarBelakang = {
  pendidikan: string
  instansi: string
  jurusan: string
  pekerjaan: string
}

export type Pendaftaran = {
  id: number
  applicantId: number
  beasiswaId: number
  status: StatusPendaftaran
  beasiswaNama?: string
  submittedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PendaftaranDetail = Pendaftaran & {
  dataDiri: DataDiri | null
  latarBelakang: LatarBelakang | null
  verifikasiTerbaru?: Verifikasi | null
  wawancaraTerbaru?: Wawancara | null
  verifikasi?: Verifikasi[]
  wawancara?: Wawancara[]
}

export type Verifikasi = {
  id: number
  pendaftaranId: number
  verifikatorId: number
  status: StatusVerifikasi
  catatan: string | null
  verifiedAt: string
}

export type Wawancara = {
  id: number
  pendaftaranId: number
  penilaiId: number
  nilai: number | null
  status: StatusWawancara
  catatan: string | null
  tanggalInput: string
}

export type UpdateDraftPayload = {
  dataDiri?: Partial<DataDiri>
  latarBelakang?: Partial<LatarBelakang>
}

export type CreateDraftResult = Pendaftaran & {
  beasiswaNama: string
}

export type SubmitVerifikasiPayload = {
  status: StatusVerifikasi
  catatan: string
}

export type SubmitPenilaianPayload = {
  nilai: number
  status: StatusWawancara
  catatan: string
}

export type PendaftaranListQuery = {
  status?: StatusPendaftaran
  beasiswaId?: number
  search?: string
  page?: number
  perPage?: number
}

export type PendaftaranListResult = {
  total: number
  page: number
  perPage: number
  totalPages: number
  items: PendaftaranDetail[]
}

export type DashboardStatistik = {
  totalPendaftar: number
  lulusAdmin: number
  tidakLulusAdmin: number
  lulusWawancara: number
  tidakLulusWawancara: number
  dalamProsesAdmin: number
  dalamProsesWawancara: number
}

export type VerifikasiKeputusanResult = Pendaftaran & {
  verifikasi: Verifikasi
}

export type WawancaraPenilaianResult = Pendaftaran & {
  wawancara: Wawancara
}