import { useState } from 'react'
import { Button } from '../../components/ui/button'
import type { StatusVerifikasi } from '../../types/pendaftaran'

const STATUS_OPTIONS: Array<{ value: StatusVerifikasi; label: string; activeClass: string }> = [
  { value: 'disetujui', label: 'Disetujui', activeClass: 'border-white bg-green-600 text-white' },
  { value: 'ditolak', label: 'Ditolak', activeClass: 'border-white bg-red-600 text-white' },
  { value: 'revisi', label: 'Revisi', activeClass: 'border-white bg-yellow-500 text-white' },
]

type VerifikasiFormProps = {
  onSubmit: (status: StatusVerifikasi, catatan: string) => void
  submitting: boolean
}

export default function VerifikasiForm({ onSubmit, submitting }: VerifikasiFormProps) {
  const [status, setStatus] = useState<StatusVerifikasi>('disetujui')
  const [catatan, setCatatan] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(status, catatan)
      }}
      className="space-y-4"
    >
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Keputusan Verifikasi</p>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                status === opt.value
                  ? opt.activeClass
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="catatan" className="mb-1 block text-sm font-medium text-slate-700">
          Catatan Verifikasi
        </label>
        <textarea
          id="catatan"
          rows={4}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Catatan untuk pemohon (wajib bila keputusan Revisi atau Ditolak)"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Menyimpan...' : 'Kirim Keputusan'}
        </Button>
      </div>
    </form>
  )
}