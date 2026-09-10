import { useEffect, useState } from 'react'
import { getPersyaratan } from '../../../api/beasiswaApi'
import { deleteDokumen, getDokumenByPendaftaran, uploadDokumen } from '../../../api/dokumenApi'
import { getErrorMessage } from '../../../api/errors'
import type { Persyaratan } from '../../../types/beasiswa'
import type { Dokumen, JenisDokumen } from '../../../types/dokumen'
import { mapPersyaratanToJenisDokumen } from '../../../utils/jenisDokumen'

type StepDokumenProps = {
  pendaftaranId: number
  beasiswaId: number
  enabled: boolean
}

function formatUkuran(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function StepDokumen({ pendaftaranId, beasiswaId, enabled }: StepDokumenProps) {
  const [persyaratan, setPersyaratan] = useState<Persyaratan[]>([])
  const [dokumen, setDokumen] = useState<Dokumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [files, setFiles] = useState<Record<number, File | null>>({})
  const [uploading, setUploading] = useState<JenisDokumen | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPersyaratan(beasiswaId), getDokumenByPendaftaran(pendaftaranId)])
      .then(([docs, uploaded]) => {
        if (cancelled) return
        setPersyaratan(docs)
        setDokumen(uploaded)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Gagal memuat data dokumen.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pendaftaranId, beasiswaId, reloadKey])

  function onRetry() {
    setLoading(true)
    setError(null)
    setReloadKey((key) => key + 1)
  }

  function clearFile(persyaratanId: number) {
    setFiles((prev) => {
      const next = { ...prev }
      delete next[persyaratanId]
      return next
    })
  }

  async function refreshDokumen() {
    const uploaded = await getDokumenByPendaftaran(pendaftaranId)
    setDokumen(uploaded)
  }

  async function onUpload(persyaratan: Persyaratan) {
    const jenis = mapPersyaratanToJenisDokumen(persyaratan.namaDokumen)
    const file = files[persyaratan.id]
    if (!jenis || !file) return
    setActionError(null)
    setUploading(jenis)
    try {
      await uploadDokumen(pendaftaranId, jenis, file)
      await refreshDokumen()
      clearFile(persyaratan.id)
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal mengunggah dokumen.'))
    } finally {
      setUploading(null)
    }
  }

  async function onDelete(dokumenRow: Dokumen) {
    setActionError(null)
    setDeletingId(dokumenRow.id)
    try {
      await deleteDokumen(dokumenRow.id)
      await refreshDokumen()
    } catch (err) {
      setActionError(getErrorMessage(err, 'Gagal menghapus dokumen.'))
    } finally {
      setDeletingId(null)
    }
  }

  const wajibDocs = persyaratan.filter((item) => item.wajib)
  const pilihanDocs = persyaratan.filter((item) => !item.wajib)

  const dokumenByJenis = new Map<JenisDokumen, Dokumen>()
  for (const doc of dokumen) {
    dokumenByJenis.set(doc.jenisDokumen, doc)
  }
  const uploadedWajibCount = wajibDocs.filter((item) => {
    const jenis = mapPersyaratanToJenisDokumen(item.namaDokumen)
    return jenis !== null && dokumenByJenis.has(jenis)
  }).length

  if (loading && persyaratan.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Memuat persyaratan...</p>
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      </div>
    )
  }

  if (persyaratan.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Tidak ada dokumen persyaratan untuk beasiswa ini.</p>
  }

  if (!enabled) {
    return (
      <div className="rounded-lg bg-slate-100 px-4 py-8 text-center text-sm text-slate-600">
        Dokumen tidak dapat diunggah atau diubah karena pendaftaran sudah tidak berstatus draft / perbaikan.
      </div>
    )
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      )}

      <p className="mb-2 text-sm text-slate-600">
        Terunggah <span className="font-semibold">{uploadedWajibCount}</span> dari{' '}
        <span className="font-semibold">{wajibDocs.length}</span> dokumen wajib.
      </p>

      <div className="space-y-4">
        {wajibDocs.map((item) => {
          const jenis = mapPersyaratanToJenisDokumen(item.namaDokumen)
          const uploaded = jenis ? dokumenByJenis.get(jenis) : undefined
          if (jenis === null) {
            return (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.namaDokumen}</p>
                  <p className="mt-1 text-xs text-slate-500">Belum punya kategori upload</p>
                </div>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Wajib</span>
              </div>
            )
          }
          return (
            <div key={item.id} className="rounded-lg border border-slate-200 px-4 py-3">
              {uploaded ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      ✓ {uploaded.namaFileAsli}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatUkuran(uploaded.ukuranBytes)} · diunggah {new Date(uploaded.uploadedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(uploaded)}
                    disabled={deletingId !== null}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === uploaded.id ? 'Menghapus...' : 'Hapus'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{item.namaDokumen}</p>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Wajib</span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setFiles((prev) => ({ ...prev, [item.id]: file }))
                      }}
                      className="text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => onUpload(item)}
                      disabled={!files[item.id] || uploading !== null}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading === jenis ? 'Mengunggah...' : 'Upload'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {pilihanDocs.length > 0 && (
          <div className="rounded-lg border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-800">Dokumen Pilihan</p>
            <ul className="mt-2 space-y-1">
              {pilihanDocs.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{item.namaDokumen}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Pilihan</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}