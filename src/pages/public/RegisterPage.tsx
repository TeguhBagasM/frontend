import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/errors'
import { useAuth } from '../../contexts/AuthContext'

const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.email('Email tidak valid'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register: registerAccount } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null)
    try {
      await registerAccount(values.name, values.email)
      setRegisteredEmail(values.email)
    } catch (error) {
      setServerError(getErrorMessage(error, 'Pendaftaran gagal. Silakan coba lagi.'))
    }
  }

  if (registeredEmail) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <h1 className="mb-3 text-2xl font-semibold text-slate-900">Daftar Berhasil</h1>
          <p className="text-sm text-slate-700">
            Password telah dikirim ke email Anda, silakan cek email dan login.
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            Dikirim ke: <span className="font-medium text-slate-900">{registeredEmail}</span>
          </p>
          <Link
            to="/login"
            className="mt-6 block rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Ke Halaman Login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Daftar</h1>

        <p className="mb-4 text-center text-sm text-slate-500">
          Password akan dibuatkan otomatis untuk Anda dan dikirim via email.
        </p>

        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-lg bg-white p-6 shadow"
          noValidate
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Nama
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              {...register('name')}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  )
}