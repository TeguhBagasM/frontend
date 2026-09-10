import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getActiveBeasiswa } from '../../api/beasiswaApi'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../../contexts/AuthContext'
import type { Beasiswa, Pagination } from '../../types/beasiswa'
import { formatTanggal } from '../../utils/format'
import { EmptyState, ErrorState, LoadingState } from '../../components/status'

const LIMIT = 8

function BeasiswaCard({ beasiswa, isLoggedIn }: { beasiswa: Beasiswa; isLoggedIn: boolean }) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{beasiswa.nama}</h2>
      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{beasiswa.deskripsi}</p>
      <dl className="mt-4 space-y-1 text-sm text-slate-700">
        <div className="flex justify-between">
          <dt className="text-slate-500">Kuota</dt>
          <dd className="font-medium">{beasiswa.kuota} peserta</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Ditutup</dt>
          <dd className="font-medium">{formatTanggal(beasiswa.tanggalTutup)}</dd>
        </div>
      </dl>
      <div className="mt-5 flex gap-3">
        <Link
          to={`/beasiswa/${beasiswa.id}`}
          className="flex-1 rounded-lg border border-blue-600 px-4 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Lihat Detail
        </Link>
        <Link
          to={isLoggedIn ? '/applicant/pendaftaran' : '/register'}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Daftar Sekarang
        </Link>
      </div>
    </article>
  )
}

function PaginationBar({
  pagination,
  page,
  disabled,
  onPageChange,
}: {
  pagination: Pagination
  page: number
  disabled: boolean
  onPageChange: (page: number) => void
}) {
  if (pagination.totalPages <= 1) {
    return null
  }
  return (
    <div className="mt-8 flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Sebelumnya
      </button>
      <span className="text-sm text-slate-600">
        Halaman {pagination.page} dari {pagination.totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page >= pagination.totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Berikutnya
      </button>
    </div>
  )
}

export default function LandingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [items, setItems] = useState<Beasiswa[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getActiveBeasiswa({ page, limit: LIMIT, search: search || undefined })
      .then((result) => {
        if (cancelled) return
        setItems(result.data)
        setPagination(result.pagination)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(err, 'Gagal memuat daftar beasiswa.'))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, search])

  function beginLoad() {
    setLoading(true)
    setError(null)
  }

  function onSubmitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginLoad()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function onPageChange(next: number) {
    beginLoad()
    setPage(next)
  }

  function onRetry() {
    beginLoad()
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  const isLoggedIn = !authLoading && user !== null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">Pendaftaran Beasiswa Pelatihan</h1>
          <nav className="flex items-center gap-3">
            <Link to="/beasiswa" className="text-sm font-medium text-slate-700 hover:text-blue-600">
              Beasiswa
            </Link>
            {isLoggedIn ? (
              <Link
                to="/applicant/status"
                className="text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                Status Pendaftaran
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                Masuk
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <section className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Beasiswa Pelatihan Terbuka</h2>
          <p className="mt-2 text-slate-600">
            Daftarkan diri Anda untuk mengikuti program pelatihan yang tersedia.
          </p>
        </section>

        <form onSubmit={onSubmitSearch} className="mx-auto mt-6 flex max-w-xl gap-3">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama beasiswa..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Cari
          </button>
        </form>

        {loading && items.length === 0 ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : items.length === 0 ? (
          <EmptyState message="Tidak ada beasiswa aktif yang tersedia saat ini." />
        ) : (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {items.map((beasiswa) => (
                <BeasiswaCard key={beasiswa.id} beasiswa={beasiswa} isLoggedIn={isLoggedIn} />
              ))}
            </div>
            {pagination && (
              <PaginationBar
                pagination={pagination}
                page={page}
                disabled={loading}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}