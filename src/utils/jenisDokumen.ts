import type { JenisDokumen } from '../types/dokumen'

const KEYWORD_MAP: Array<{ keywords: string[]; jenis: JenisDokumen }> = [
  { keywords: ['ktp'], jenis: 'KTP' },
  { keywords: ['keluarga', '(kk)'], jenis: 'KK' },
  { keywords: ['ijazah', 'transkrip'], jenis: 'Ijazah' },
  { keywords: ['rekomendasi'], jenis: 'Surat Rekomendasi' },
]

/** Map nama dokumen persyaratan (Data Master, bebas-form) ke kategori upload
 *  dokumen (enum tertutup). Cocokkan lewat kata kunci; null bila tidak ada
 *  yang cocok (mis. "Surat Keterangan Tidak Mampu", "Kartu KIP Kuliah"). */
export function mapPersyaratanToJenisDokumen(namaDokumen: string): JenisDokumen | null {
  const normalized = namaDokumen.toLowerCase()
  for (const { keywords, jenis } of KEYWORD_MAP) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return jenis
    }
  }
  return null
}