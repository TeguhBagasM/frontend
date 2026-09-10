export type JenisDokumen = 'KTP' | 'KK' | 'Ijazah' | 'Surat Rekomendasi'

export type Dokumen = {
  id: number
  pendaftaranId: number
  jenisDokumen: JenisDokumen
  namaFileAsli: string
  mimeType: string
  ukuranBytes: number
  uploadedBy: number
  uploadedAt: string
  createdAt: string
}