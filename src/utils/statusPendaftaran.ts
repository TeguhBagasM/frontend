import type { StatusPendaftaran } from '../types/pendaftaran'

/** Label Indonesia untuk setiap status pendaftaran. */
export const STATUS_LABEL: Record<StatusPendaftaran, string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  under_review_admin: 'Menunggu Verifikasi Admin',
  revisi_diminta: 'Perlu Perbaikan',
  ditolak_admin: 'Ditolak',
  lolos_admin: 'Lolos Verifikasi Admin',
  under_review_wawancara: 'Menunggu Wawancara',
  tidak_lulus_wawancara: 'Tidak Lulus Wawancara',
  lulus_wawancara: 'Lulus Seleksi',
}

/** Kelas badge Tailwind per warna — sesuai mapping requester:
 *  abu-abu (draft/submitted/under_review_admin), kuning (revisi_diminta),
 *  merah (ditolak_admin/tidak_lulus_wawancara), biru (lolos_admin/
 *  under_review_wawancara), hijau (lulus_wawancara). */
export const STATUS_BADGE_CLASS: Record<StatusPendaftaran, string> = {
  draft: 'bg-slate-100 text-slate-700',
  submitted: 'bg-slate-100 text-slate-700',
  under_review_admin: 'bg-slate-100 text-slate-700',
  revisi_diminta: 'bg-yellow-100 text-yellow-800',
  ditolak_admin: 'bg-red-100 text-red-700',
  tidak_lulus_wawancara: 'bg-red-100 text-red-700',
  lolos_admin: 'bg-blue-100 text-blue-700',
  under_review_wawancara: 'bg-blue-100 text-blue-700',
  lulus_wawancara: 'bg-green-100 text-green-800',
}

/** Status yang masih boleh diubah/diperbaiki oleh applicant. */
export function isEditableStatus(status: StatusPendaftaran): boolean {
  return status === 'draft' || status === 'revisi_diminta'
}