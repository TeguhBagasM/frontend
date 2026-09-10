import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getErrorMessage } from '../../api/errors'
import { homeForRole } from '../../constants/home-routes'
import { useAuth } from '../../contexts/AuthContext'

const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginFormValues) {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      navigate(homeForRole(user.roleName), { replace: true })
    } catch (error) {
      setServerError(getErrorMessage(error, 'Login gagal. Silakan coba lagi.'))
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">
          Masuk
        </h1>

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

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </main>
  )
}