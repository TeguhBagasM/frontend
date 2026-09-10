import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors'
import { getDokumenByPendaftaran, fetchFileBlob, revokeFileBlobUrl } from '../../api/dokumenApi'
import { getPendaftaranById, submitVerifikasi } from '../../api/pendaftaranApi'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import type { Dokumen } from '../../types/dokumen'
import type { PendaftaranDetail, StatusVerifikasi } from '../../types/pendaftaran'
import { STATUS_BADGE_CLASS } from '../../utils/statusPendaftaran'
import VerifikasiForm from './VerifikasiForm'

export default function VerifikasiDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [pendaftaran, setPendaftaran] = useState<PendaftaranDetail | null>(null)
  const [dokumenList, setDokumenList] = useState<Dokumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        setError(null)
        if (!id) {
          throw new Error('ID pendaftaran tidak ditemukan')
        }
        const [pendaftaranData, dokumenData] = await Promise.all([
          getPendaftaranById(Number(id)),
          getDokumenByPendaftaran(Number(id)),
        ])
        setPendaftaran(pendaftaranData)
        setDokumenList(dokumenData)
      } catch (err) {
        setError(getErrorMessage(err, 'Gagal memuat detail pendaftaran.'))
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  const handleSubmitVerifikasi = async (status: StatusVerifikasi, catatan: string) => {
    if (!id) {
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      await submitVerifikasi(Number(id), { status, catatan })
      navigate('/verifikator/list', {
        state: { message: 'Keputusan verifikasi berhasil disimpan.' },
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menyimpan keputusan verifikasi.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async (dokumenId: number) => {
    try {
      const { blobUrl, namaFileAsli } = await fetchFileBlob(dokumenId)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = namaFileAsli
      link.click()
      revokeFileBlobUrl(blobUrl)
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal mengunduh dokumen.'))
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
        <h1 className="text-3xl font-bold">Verifikasi Pendaftaran</h1>
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
          <dl className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <dt className="font-medium">NIK</dt>
              <dd className="text-slate-600">{pendaftaran.dataDiri?.nik || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Email</dt>
              <dd className="text-slate-600">{pendaftaran.dataDiri?.email || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">No. HP</dt>
              <dd className="text-slate-600">{pendaftaran.dataDiri?.noHp1 || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Alamat</dt>
              <dd className="text-slate-600">{pendaftaran.dataDiri?.alamat || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Pendidikan</dt>
              <dd className="text-slate-600">{pendaftaran.latarBelakang?.pendidikan || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Instansi</dt>
              <dd className="text-slate-600">{pendaftaran.latarBelakang?.instansi || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Jurusan</dt>
              <dd className="text-slate-600">{pendaftaran.latarBelakang?.jurusan || '-'}</dd>
            </div>
            <div>
              <dt className="font-medium">Pekerjaan</dt>
              <dd className="text-slate-600">{pendaftaran.latarBelakang?.pekerjaan || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dokumen Pendukung</CardTitle>
          <CardDescription>Dokumen yang diunggah pemohon</CardDescription>
        </CardHeader>
        <CardContent>
          {dokumenList.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada dokumen.</p>
          ) : (
            <ul className="space-y-2">
              {dokumenList.map((dokumen) => (
                <li
                  key={dokumen.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{dokumen.jenisDokumen.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-500">{dokumen.namaFileAsli}</p>
                  </div>
                  <Button variant="outline" onClick={() => handleDownload(dokumen.id)}>
                    Unduh
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Keputusan Verifikasi</CardTitle>
          <CardDescription>Beri keputusan untuk pendaftaran ini</CardDescription>
        </CardHeader>
        <CardContent>
          {pendaftaran.verifikasiTerbaru && (
            <p className="mb-4 text-sm text-slate-600">
              Keputusan terakhir: {pendaftaran.verifikasiTerbaru.status.replace('_', ' ')}
              {pendaftaran.verifikasiTerbaru.catatan
                ? ` — ${pendaftaran.verifikasiTerbaru.catatan}`
                : ''}
            </p>
          )}
          <VerifikasiForm onSubmit={handleSubmitVerifikasi} submitting={submitting} />
        </CardContent>
      </Card>
    </div>
  )
}