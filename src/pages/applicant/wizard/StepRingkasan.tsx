import { useState } from 'react'
import { getErrorMessage } from '../../../api/errors'
import { IncompleteSubmissionError, submitFinal } from '../../../api/pendaftaranApi'
import type { PendaftaranDetail } from '../../../types/pendaftaran'
import { formatTanggal } from '../../../utils/format'
import { STATUS_BADGE_CLASS, STATUS_LABEL } from '../../../utils/statusPendaftaran'

type StepRingkasanProps = {
  pendaftaran: PendaftaranDetail
  beasiswaNama: string | null
  enabled: boolean
  onSubmitted: () => void
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  )
}

export default function StepRingkasan({
  pendaftaran,
  beasiswaNama,
  enabled,
  onSubmitted,
}: StepRingkasanProps) {
  const [setuju, setSetuju] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await submitFinal(pendaftaran.id)
      onSubmitted()
    } catch (err) {
      // IncompleteSubmissionError membawa pesan backend PERSIS —
      // tampilkan apa adanya tanpa menulis ulang daftar field di frontend.
      if (err instanceof IncompleteSubmissionError) {
        setError(err.message)
      } else {
        setError(getErrorMessage(err, 'Gagal mengirim pendaftaran.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const dataDiri = pendaftaran.dataDiri
  const latarBelakang = pendaftaran.latarBelakang

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {beasiswaNama ?? `Beasiswa #${pendaftaran.beasiswaId}`}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Dibuat {formatTanggal(pendaftaran.createdAt)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[pendaftaran.status]}`}
          >
            {STATUS_LABEL[pendaftaran.status]}
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Data Diri</h3>
        {dataDiri ? (
          <dl className="space-y-2">
            <FieldRow label="NIK" value={dataDiri.nik} />
            <FieldRow label="Nama" value={dataDiri.nama} />
            <FieldRow label="Tanggal Lahir" value={formatTanggal(dataDiri.tglLahir)} />
            <FieldRow label="Alamat" value={dataDiri.alamat} />
            <FieldRow label="No. HP 1" value={dataDiri.noHp1} />
            <FieldRow label="No. HP 2" value={dataDiri.noHp2 ?? '-'} />
            <FieldRow label="Email" value={dataDiri.email} />
          </dl>
        ) : (
          <p className="text-sm text-amber-700">
            Data diri belum diisi — lengkapi pada Langkah 1.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Latar Belakang
        </h3>
        {latarBelakang ? (
          <dl className="space-y-2">
            <FieldRow label="Pendidikan" value={latarBelakang.pendidikan} />
            <FieldRow label="Instansi" value={latarBelakang.instansi} />
            <FieldRow label="Jurusan" value={latarBelakang.jurusan} />
            <FieldRow label="Pekerjaan" value={latarBelakang.pekerjaan} />
          </dl>
        ) : (
          <p className="text-sm text-amber-700">
            Latar belakang belum diisi — lengkapi pada Langkah 2.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pernyataan
        </h3>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={setuju}
            onChange={(event) => setSetuju(event.target.checked)}
            disabled={!enabled}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Saya menyatakan bahwa seluruh data dan dokumen yang saya isi adalah benar dan dapat
          dipertanggungjawabkan.
        </label>
      </section>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!enabled && (
        <p className="text-sm text-slate-600">
          Pendaftaran sudah tidak dalam status draft/perbaikan, sehingga tidak dapat dikirim ulang.
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!enabled || !setuju || submitting}
        className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Mengirim pendaftaran...' : 'Kirim Pendaftaran'}
      </button>
    </div>
  )
}