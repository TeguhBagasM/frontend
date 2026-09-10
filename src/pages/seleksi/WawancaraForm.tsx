import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors'
import { getPendaftaranById, submitPenilaianWawancara } from '../../api/pendaftaranApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import type { PendaftaranDetail, StatusWawancara } from '../../types/pendaftaran'
import { STATUS_BADGE_CLASS } from '../../utils/statusPendaftaran'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

export default function WawancaraForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pendaftaran, setPendaftaran] = useState<PendaftaranDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [nilai, setNilai] = useState('')
  const [status, setStatus] = useState<StatusWawancara>('lulus')
  const [catatan, setCatatan] = useState('')

  useEffect(() => {
    const fetchPendaftaran = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!id) {
          throw new Error('ID pendaftaran tidak ditemukan')
        }
        const result = await getPendaftaranById(Number(id))
        setPendaftaran(result)
        if (result.wawancaraTerbaru) {
          setNilai(String(result.wawancaraTerbaru.nilai ?? ''))
          setStatus(result.wawancaraTerbaru.status)
          setCatatan(result.wawancaraTerbaru.catatan ?? '')
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Gagal memuat detail pendaftaran.'))
      } finally {
        setLoading(false)
      }
    }
    fetchPendaftaran()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) {
      return
    }
    const nilaiValue = Number(nilai)
    if (Number.isNaN(nilaiValue) || nilaiValue < 0 || nilaiValue > 100) {
      setError('Nilai harus antara 0-100.')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await submitPenilaianWawancara(Number(id), { nilai: nilaiValue, status, catatan })
      navigate('/seleksi/wawancara', {
        state: { message: 'Penilaian wawancara berhasil disimpan.' },
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan penilaian wawancara.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return <div className="rounded-md bg-red-50 p-4 text-red-700">{error}</div>
  }

  if (!pendaftaran) {
    return <div className="rounded-md bg-red-50 p-4 text-red-700">Pendaftaran tidak ditemukan.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Penilaian Wawancara</h1>
        <p className="text-gray-600">
          {pendaftaran.beasiswaNama || `Beasiswa #${pendaftaran.beasiswaId}`}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>{pendaftaran.dataDiri?.nama || 'Pendaftar'}</span>
            <Badge className={STATUS_BADGE_CLASS[pendaftaran.status]}>
              {pendaftaran.status.replace('_', ' ')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nilai" className="mb-1 block text-sm font-medium text-slate-700">
                Nilai Wawancara (0-100)
              </label>
              <input
                id="nilai"
                type="number"
                min={0}
                max={100}
                required
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                className={inputClass}
                placeholder="Contoh: 85"
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Hasil Wawancara</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('lulus')}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    status === 'lulus'
                      ? 'border-white bg-green-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Lulus
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('tidak_lulus')}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    status === 'tidak_lulus'
                      ? 'border-white bg-red-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Tidak Lulus
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="catatan" className="mb-1 block text-sm font-medium text-slate-700">
                Catatan Wawancara
              </label>
              <textarea
                id="catatan"
                rows={4}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className={inputClass}
                placeholder="Masukkan catatan wawancara (opsional)"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan Penilaian'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}