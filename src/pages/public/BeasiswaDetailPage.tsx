import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBeasiswaById, getPersyaratan } from '../../api/beasiswaApi'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../../contexts/AuthContext'
import type { BeasiswaDetail, Persyaratan } from '../../types/beasiswa'
import { formatTanggal } from '../../utils/format'
import { ErrorState, LoadingState } from '../../components/status'

export default function BeasiswaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, isLoading: authLoading } = useAuth()
  const [beasiswa, setBeasiswa] = useState<BeasiswaDetail | null>(null)
  const [persyaratan, setPersyaratan] = useState<Persyaratan[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    const beasiswaId = Number(id)
    Promise.all([getBeasiswaById(beasiswaId), getPersyaratan(beasiswaId)])
      .then(([detail, docs]) => {
        if (cancelled) return
        setBeasiswa(detail)
        setPersyaratan(docs)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Gagal memuat detail beasiswa.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Kembali ke beranda
          </Link>
          <ErrorState message="ID beasiswa tidak valid." />
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingState label="Memuat detail beasiswa..." />
  }

  if (error || !beasiswa) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Kembali ke beranda
          </Link>
          <ErrorState message={error ?? 'Beasiswa tidak ditemukan.'} />
        </div>
      </div>
    )
  }

  const wajibDocs = persyaratan?.filter((item) => item.wajib) ?? []
  const pilihanDocs = persyaratan?.filter((item) => !item.wajib) ?? []
  const isLoggedIn = !authLoading && user !== null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Kembali ke beranda
          </Link>
          <span className="text-sm font-medium text-slate-700">Detail Beasiswa</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{beasiswa.nama}</h1>
          <dl className="mt-4 grid gap-4 text-sm text-slate-700 sm:grid-cols-3">
            <div>
              <dt className="text-slate-500">Kuota</dt>
              <dd className="mt-1 font-medium">{beasiswa.kuota} peserta</dd>
            </div>
            <div>
              <dt className="text-slate-500">Dibuka</dt>
              <dd className="mt-1 font-medium">{formatTanggal(beasiswa.tanggalBuka)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Ditutup</dt>
              <dd className="mt-1 font-medium">{formatTanggal(beasiswa.tanggalTutup)}</dd>
            </div>
          </dl>
          <p className="mt-4 whitespace-pre-line text-slate-700">{beasiswa.deskripsi}</p>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dokumen Persyaratan</h2>
          {persyaratan === null || persyaratan.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Tidak ada dokumen persyaratan untuk beasiswa ini.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {wajibDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-800">{doc.namaDokumen}</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                    Wajib
                  </span>
                </div>
              ))}
              {pilihanDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm text-slate-700">{doc.namaDokumen}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Pilihan
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 flex justify-center">
          <Link
            to={
              isLoggedIn
                ? { pathname: '/applicant/pendaftaran', search: `?beasiswaId=${beasiswa.id}` }
                : '/register'
            }
            className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Daftar Beasiswa Ini
          </Link>
        </div>
      </main>
    </div>
  )
}