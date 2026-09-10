import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { getBeasiswaById } from '../../api/beasiswaApi'
import { getErrorMessage } from '../../api/errors'
import {
  DuplicateDraftError,
  createDraft,
  getMyPendaftaran,
  getPendaftaranById,
  updateDraft,
} from '../../api/pendaftaranApi'
import { ErrorState, LoadingState } from '../../components/status'
import type { Beasiswa } from '../../types/beasiswa'
import type { PendaftaranDetail } from '../../types/pendaftaran'
import { isEditableStatus, STATUS_BADGE_CLASS, STATUS_LABEL } from '../../utils/statusPendaftaran'
import StepDokumen from './wizard/StepDokumen'
import StepRingkasan from './wizard/StepRingkasan'

const dataDiriSchema = z.object({
  nik: z.string().min(16, 'NIK wajib 16 digit').max(20, 'NIK maksimal 20 karakter'),
  nama: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  tglLahir: z.string().min(1, 'Tanggal lahir wajib diisi'),
  alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
  noHp1: z.string().min(8, 'Nomor HP 1 tidak valid'),
  noHp2: z
    .string()
    .refine((value) => value === '' || value.length >= 8, 'Nomor HP 2 tidak valid')
    .optional(),
  email: z.email('Email tidak valid'),
})
type DataDiriValues = z.infer<typeof dataDiriSchema>

const latarBelakangSchema = z.object({
  pendidikan: z.string().min(2, 'Pendidikan wajib diisi'),
  instansi: z.string().min(2, 'Instansi wajib diisi'),
  jurusan: z.string().min(1, 'Jurusan wajib diisi'),
  pekerjaan: z.string().min(1, 'Pekerjaan wajib diisi'),
})
type LatarBelakangValues = z.infer<typeof latarBelakangSchema>

const STEPS = [
  { nomor: 1, label: 'Data Diri' },
  { nomor: 2, label: 'Latar Belakang' },
  { nomor: 3, label: 'Dokumen' },
  { nomor: 4, label: 'Ringkasan' },
]

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export default function WizardPendaftaranPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Mode buat baru: /applicant/pendaftaran?beasiswaId=N (createDraft dulu).
  // Mode lanjut/edit: /applicant/pendaftaran/:id (muat pendaftaran yang ada).
  const rawId = id ?? ''
  const pendaftaranId = rawId ? Number(rawId) : null
  const invalidId = rawId !== '' && (!Number.isInteger(pendaftaranId) || (pendaftaranId ?? 0) <= 0)
  const isNew = rawId === ''

  const rawBeasiswaId = searchParams.get('beasiswaId')
  const beasiswaId = rawBeasiswaId ? Number(rawBeasiswaId) : Number.NaN
  const invalidBeasiswaId =
    rawBeasiswaId === null || !Number.isInteger(beasiswaId) || beasiswaId <= 0

  const [creating, setCreating] = useState(isNew)
  const [createError, setCreateError] = useState<string | null>(null)
  const [duplicateMessage, setDuplicateMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pendaftaran, setPendaftaran] = useState<PendaftaranDetail | null>(null)
  const [beasiswa, setBeasiswa] = useState<Beasiswa | null>(null)
  const [step, setStep] = useState(1)
  const [dataDiriSaved, setDataDiriSaved] = useState(false)
  const [latarBelakangSaved, setLatarBelakangSaved] = useState(false)
  const [actionErrors, setActionErrors] = useState<{ dataDiri?: string; latarBelakang?: string }>({})

  const createStarted = useRef(false)

  const dataDiriForm = useForm<DataDiriValues>({ resolver: zodResolver(dataDiriSchema) })
  const latarBelakangForm = useForm<LatarBelakangValues>({
    resolver: zodResolver(latarBelakangSchema),
  })

  async function resolveExistingDraft(targetBeasiswaId: number) {
    try {
      const mine = await getMyPendaftaran()
      const existing = mine.find(
        (item) => item.beasiswaId === targetBeasiswaId && isEditableStatus(item.status),
      )
      if (existing) {
        navigate(`/applicant/pendaftaran/${existing.id}`, { replace: true })
        return
      }
    } catch {
      // Tidak bisa memastikan id draft yang ada — jatuh ke fallback manual.
    }
    setDuplicateMessage('Anda sudah punya pendaftaran aktif untuk beasiswa ini.')
  }

  // 409 tidak mengembalikan id draft konflik (AppError hanya { status, message }),
  // jadi kalau kena DuplicateDraftError kita coba cari id pendaftaran aktif
  // yang masih bisa diedit lewat getMyPendaftaran, lalu redirect otomatis.
  // Kalau tidak ketemu, tampilkan pesan fallback + tautan monitoring.
  useEffect(() => {
    if (!isNew) return
    if (createStarted.current) return
    createStarted.current = true
    if (invalidBeasiswaId) return

    createDraft(beasiswaId)
      .then((result) => {
        navigate(`/applicant/pendaftaran/${result.id}`, { replace: true })
      })
      .catch((err: unknown) => {
        if (err instanceof DuplicateDraftError) {
          resolveExistingDraft(beasiswaId)
        } else {
          setCreateError(getErrorMessage(err, 'Gagal membuat pendaftaran.'))
        }
      })
      .finally(() => setCreating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew])

  useEffect(() => {
    if (isNew || pendaftaranId === null) return
    let cancelled = false

    getPendaftaranById(pendaftaranId)
      .then((detail) => {
        if (cancelled) return
        setPendaftaran(detail)
        if (detail.dataDiri) {
          const dd = detail.dataDiri
          dataDiriForm.reset({
            nik: dd.nik,
            nama: dd.nama,
            tglLahir: dd.tglLahir.slice(0, 10),
            alamat: dd.alamat,
            noHp1: dd.noHp1,
            noHp2: dd.noHp2 ?? '',
            email: dd.email,
          })
          setDataDiriSaved(true)
        }
        if (detail.latarBelakang) {
          const lb = detail.latarBelakang
          latarBelakangForm.reset(lb)
          setLatarBelakangSaved(true)
        }
        return getBeasiswaById(detail.beasiswaId)
          .then((b) => {
            if (!cancelled) setBeasiswa(b)
          })
          .catch(() => {
            // Nama beasiswa hanya pelengkap — abaikan bila gagal.
          })
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(err, 'Gagal memuat pendaftaran.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendaftaranId])

  if (invalidId) {
    return <ErrorScreen message="ID pendaftaran tidak valid." />
  }

  if (isNew && invalidBeasiswaId) {
    return (
      <ErrorScreen message="Beasiswa tidak dipilih. Silakan pilih beasiswa dari halaman beranda terlebih dahulu." />
    )
  }

  if (isNew && creating) {
    return <LoadingState label="Menyiapkan pendaftaran Anda..." />
  }

  if (isNew && createError) {
    return <ErrorScreen message={createError} />
  }

  if (isNew && duplicateMessage) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col justify-center px-4 text-center">
        <h2 className="text-xl font-semibold text-slate-900">Anda sudah pernah mendaftar</h2>
        <p className="mt-2 text-slate-600">{duplicateMessage}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/applicant/status"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lihat Status Pendaftaran
          </Link>
          <Link
            to="/beasiswa"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Kembali
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingState label="Memuat pendaftaran Anda..." />
  }

  if (loadError || !pendaftaran) {
    return <ErrorScreen message={loadError ?? 'Pendaftaran tidak ditemukan.'} />
  }

  const editable = isEditableStatus(pendaftaran.status)
  const stepDone: Record<number, boolean> = {
    1: dataDiriSaved,
    2: latarBelakangSaved,
  }

  async function saveDataDiri(values: DataDiriValues, lanjut: boolean) {
    const noHp2 = values.noHp2?.trim() ?? ''
    const payload = {
      nik: values.nik,
      nama: values.nama,
      tglLahir: values.tglLahir,
      alamat: values.alamat,
      noHp1: values.noHp1,
      email: values.email,
      ...(noHp2 ? { noHp2 } : {}),
    }
    try {
      await updateDraft(pendaftaran!.id, { dataDiri: payload })
      setDataDiriSaved(true)
      setActionErrors((prev) => ({ ...prev, dataDiri: undefined }))
      if (lanjut) setStep(2)
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        dataDiri: getErrorMessage(err, 'Gagal menyimpan data diri.'),
      }))
    }
  }

  async function saveLatarBelakang(values: LatarBelakangValues, lanjut: boolean) {
    try {
      await updateDraft(pendaftaran!.id, { latarBelakang: values })
      setLatarBelakangSaved(true)
      setActionErrors((prev) => ({ ...prev, latarBelakang: undefined }))
      if (lanjut) setStep(3)
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        latarBelakang: getErrorMessage(err, 'Gagal menyimpan latar belakang.'),
      }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/beasiswa" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Daftar Beasiswa
          </Link>
          <div className="flex items-center gap-3">
            {pendaftaran.status === 'draft' && (
              <Link
                to="/applicant/status"
                className="text-sm font-medium text-slate-700 hover:text-blue-600"
              >
                Status Pendaftaran
              </Link>
            )}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE_CLASS[pendaftaran.status]}`}
            >
              {STATUS_LABEL[pendaftaran.status]}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900">
          {beasiswa?.nama ?? pendaftaran.beasiswaNama ?? `Beasiswa #${pendaftaran.beasiswaId}`}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Lengkapi pendaftaran Anda lalu kirim untuk diverifikasi admin.
        </p>

        {!editable && (
          <div className="mt-4 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
            Pendaftaran berstatus {STATUS_LABEL[pendaftaran.status]} dan tidak dapat diubah lagi.
            Pantau perkembangan di halaman status pendaftaran.
          </div>
        )}

        <ol className="mt-6 flex items-center gap-2 overflow-x-auto text-sm">
          {STEPS.map((item, index) => {
            const active = step === item.nomor
            const done = stepDone[item.nomor] ?? false
            return (
              <li key={item.nomor} className="flex items-center gap-2">
                {index > 0 && <span className="h-px w-6 bg-slate-300" />}
                <button
                  type="button"
                  onClick={() => setStep(item.nomor)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 font-medium ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      active ? 'bg-white/20' : done ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {done && !active ? '✓' : item.nomor}
                  </span>
                  {item.label}
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div hidden={step !== 1}>
            <h2 className="text-lg font-semibold text-slate-900">Langkah 1 — Data Diri</h2>
            {dataDiriSaved && <SavedIndicator label="Langkah 1 tersimpan" />}
            <form
              onSubmit={dataDiriForm.handleSubmit((values) => saveDataDiri(values, false))}
              className="mt-4 space-y-4"
              noValidate
            >
              <fieldset disabled={!editable} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="nik" label="NIK">
                    <input
                      id="nik"
                      className={inputClass}
                      {...dataDiriForm.register('nik')}
                    />
                    {dataDiriForm.formState.errors.nik && (
                      <p className="mt-1 text-xs text-red-600">
                        {dataDiriForm.formState.errors.nik.message}
                      </p>
                    )}
                  </Field>
                  <Field id="nama" label="Nama Lengkap">
                    <input
                      id="nama"
                      className={inputClass}
                      {...dataDiriForm.register('nama')}
                    />
                    {dataDiriForm.formState.errors.nama && (
                      <p className="mt-1 text-xs text-red-600">
                        {dataDiriForm.formState.errors.nama.message}
                      </p>
                    )}
                  </Field>
                  <Field id="tglLahir" label="Tanggal Lahir">
                    <input
                      id="tglLahir"
                      type="date"
                      className={inputClass}
                      {...dataDiriForm.register('tglLahir')}
                    />
                    {dataDiriForm.formState.errors.tglLahir && (
                      <p className="mt-1 text-xs text-red-600">
                        {dataDiriForm.formState.errors.tglLahir.message}
                      </p>
                    )}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="alamat" label="Alamat">
                      <textarea
                        id="alamat"
                        rows={2}
                        className={inputClass}
                        {...dataDiriForm.register('alamat')}
                      />
                      {dataDiriForm.formState.errors.alamat && (
                        <p className="mt-1 text-xs text-red-600">
                          {dataDiriForm.formState.errors.alamat.message}
                        </p>
                      )}
                    </Field>
                  </div>
                  <Field id="noHp1" label="Nomor HP 1">
                    <input
                      id="noHp1"
                      inputMode="tel"
                      className={inputClass}
                      {...dataDiriForm.register('noHp1')}
                    />
                    {dataDiriForm.formState.errors.noHp1 && (
                      <p className="mt-1 text-xs text-red-600">
                        {dataDiriForm.formState.errors.noHp1.message}
                      </p>
                    )}
                  </Field>
                  <Field id="noHp2" label="Nomor HP 2" hint="Opsional">
                    <input
                      id="noHp2"
                      inputMode="tel"
                      className={inputClass}
                      {...dataDiriForm.register('noHp2')}
                    />
                    {dataDiriForm.formState.errors.noHp2 && (
                      <p className="mt-1 text-xs text-red-600">
                        {dataDiriForm.formState.errors.noHp2.message}
                      </p>
                    )}
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="email" label="Email">
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={inputClass}
                        {...dataDiriForm.register('email')}
                      />
                      {dataDiriForm.formState.errors.email && (
                        <p className="mt-1 text-xs text-red-600">
                          {dataDiriForm.formState.errors.email.message}
                        </p>
                      )}
                    </Field>
                  </div>
                </div>
              </fieldset>
              {actionErrors.dataDiri && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionErrors.dataDiri}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!editable || dataDiriForm.formState.isSubmitting}
                >
                  {dataDiriForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data Diri'}
                </button>
                <button
                  type="button"
                  onClick={dataDiriForm.handleSubmit((values) => saveDataDiri(values, true))}
                  className="rounded-lg border border-blue-600 px-5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!editable || dataDiriForm.formState.isSubmitting}
                >
                  Simpan & Lanjut
                </button>
              </div>
            </form>
          </div>

          <div hidden={step !== 2}>
            <h2 className="text-lg font-semibold text-slate-900">Langkah 2 — Latar Belakang</h2>
            {latarBelakangSaved && <SavedIndicator label="Langkah 2 tersimpan" />}
            <form
              onSubmit={latarBelakangForm.handleSubmit((values) => saveLatarBelakang(values, true))}
              className="mt-4 space-y-4"
              noValidate
            >
              <fieldset disabled={!editable} className="space-y-4">
                {(
                  [
                    ['pendidikan', 'Jenjang Pendidikan'],
                    ['instansi', 'Nama Instansi'],
                    ['jurusan', 'Jurusan'],
                    ['pekerjaan', 'Pekerjaan Saat Ini'],
                  ] as const
                ).map(([name, label]) => {
                  const error = latarBelakangForm.formState.errors[name]
                  return (
                    <Field key={name} id={name} label={label}>
                      <input
                        id={name}
                        className={inputClass}
                        {...latarBelakangForm.register(name)}
                      />
                      {error && <p className="mt-1 text-xs text-red-600">{error.message}</p>}
                    </Field>
                  )
                })}
              </fieldset>
              {actionErrors.latarBelakang && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionErrors.latarBelakang}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!editable || latarBelakangForm.formState.isSubmitting}
                >
                  {latarBelakangForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut'}
                </button>
              </div>
            </form>
          </div>

          <div hidden={step !== 3}>
            <h2 className="text-lg font-semibold text-slate-900">Langkah 3 — Dokumen Pendukung</h2>
            <p className="mt-1 text-sm text-slate-500">
              Unggah dokumen wajib sesuai persyaratan beasiswa. Maksimal 5MB, format PDF / JPG / PNG.
            </p>
            <div className="mt-4">
              <StepDokumen
                pendaftaranId={pendaftaran.id}
                beasiswaId={pendaftaran.beasiswaId}
                enabled={editable}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Lihat Ringkasan
              </button>
            </div>
          </div>

          <div hidden={step !== 4}>
            <h2 className="text-lg font-semibold text-slate-900">Langkah 4 — Ringkasan & Kirim</h2>
            <div className="mt-4">
              <StepRingkasan
                pendaftaran={pendaftaran}
                beasiswaNama={beasiswa?.nama ?? pendaftaran.beasiswaNama ?? null}
                enabled={editable}
                onSubmitted={() =>
                  navigate('/applicant/status', { state: { submitted: true }, replace: true })
                }
              />
            </div>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function SavedIndicator({ label }: { label: string }) {
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      ✓ {label}
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <ErrorState message={message} />
        <div className="mt-4 text-center">
          <Link to="/beasiswa" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Kembali ke daftar beasiswa
          </Link>
        </div>
      </div>
    </div>
  )
}