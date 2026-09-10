import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getBeasiswaById } from '../../api/beasiswaApi'
import { getErrorMessage } from '../../api/errors'
import { getMyPendaftaran, getVerifikasiHistori } from '../../api/pendaftaranApi'
import { EmptyState, ErrorState, LoadingState } from '../../components/status'
import type { PendaftaranDetail } from '../../types/pendaftaran'
import { formatTanggal } from '../../utils/format'
import { isEditableStatus, STATUS_BADGE_CLASS, STATUS_LABEL } from '../../utils/statusPendaftaran'

type LocationState = { submitted?: boolean }

export default function MonitoringStatusPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState<PendaftaranDetail[]>([])
  const [names, setNames] = useState<Record<number, string>>({})
  const [revisiNotes, setRevisiNotes] = useState<Record<number, string | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const submittedBanner = (location.state as LocationState | null)?.submitted === true

  useEffect(() => {
    let cancelled = false

    getMyPendaftaran()
      .then(async (mine) => {
        if (cancelled) return
        setItems(mine)

        const beasiswaIds = [...new Set(mine.map((item) => item.beasiswaId))]
        const nameEntries = await Promise.all(
          beasiswaIds.map(async (beasiswaId) => {
            try {
              const detail = await getBeasiswaById(beasiswaId)
              return [beasiswaId, detail.nama] as const
            } catch {
              return [beasiswaId, `Beasiswa #${beasiswaId}`] as const
            }
          }),
        )
        if (!cancelled) {
          setNames(
            nameEntries.reduce<Record<number, string>>((acc, [beasiswaId, nama]) => {
              acc[beasiswaId] = nama
              return acc
            }, {}),
          )
        }

        // Status revisi_diminta — tampilkan catatan terbaru dari verifikator
        // (histori terurut terbaru-dulu, jadi elemen pertama = catatan terbaru).
        const revisiIds = mine.filter((item) => item.status === 'revisi_diminta').map((item) => item.id)
        const noteEntries = await Promise.all(
          revisiIds.map(async (id) => {
            try {
              const histori = await getVerifikasiHistori(id)
              return [id, histori[0]?.catatan ?? null] as const
            } catch {
              return [id, null] as const
            }
          }),
        )
        if (!cancelled) {
          setRevisiNotes(
            noteEntries.reduce<Record<number, string | null>>((acc, [id, catatan]) => {
              acc[id] = catatan
              return acc
            }, {}),
          )
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Gagal memuat status pendaftaran.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [reloadKey])

  function onRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/beasiswa" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Daftar Beasiswa
          </Link>
          <span className="text-sm font-medium text-slate-700">Status Pendaftaran</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Status Pendaftaran</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau perkembangan pendaftaran beasiswa pelatihan Anda.
        </p>

        {submittedBanner && (
          <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
            Pendaftaran berhasil dikirim. Tim verifikasi akan segera memeriksanya.
          </div>
        )}

        {loading && items.length === 0 ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState message="Anda belum memiliki pendaftaran. Silakan daftar dari halaman daftar beasiswa." />
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => {
              const namaBeasiswa = names[item.beasiswaId] ?? `Beasiswa #${item.beasiswaId}`
              const isRevisi = item.status === 'revisi_diminta'
              const isDraft = item.status === 'draft'
              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">
                        {namaBeasiswa}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.dataDiri?.nama ? `Atas nama ${item.dataDiri.nama}` : 'Data diri belum diisi'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[item.status]}`}
                    >
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Dikirim</dt>
                      <dd className="font-medium">
                        {item.submittedAt ? formatTanggal(item.submittedAt) : 'Belum dikirim'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Diperbarui</dt>
                      <dd className="font-medium">{formatTanggal(item.updatedAt)}</dd>
                    </div>
                  </dl>

                  {isRevisi && (
                    <div className="mt-4 rounded-lg bg-yellow-50 px-4 py-3">
                      <p className="text-sm text-yellow-900">
                        <span className="font-semibold">Catatan verifikator: </span>
                        {revisiNotes[item.id] ?? 'Belum ada catatan.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/applicant/pendaftaran/${item.id}`)}
                        className="mt-3 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Perbaiki &amp; Submit Ulang
                      </button>
                    </div>
                  )}

                  {isEditableStatus(item.status) && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => navigate(`/applicant/pendaftaran/${item.id}`)}
                        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        {isDraft ? 'Lanjutkan Mengisi' : 'Lanjutkan Pendaftaran'}
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}