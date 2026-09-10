import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <h1 className="text-5xl font-bold text-slate-900">403</h1>
      <p className="text-slate-500">
        Anda tidak memiliki akses ke halaman ini
      </p>
      <Link to="/" className="mt-4 font-medium text-blue-600">
        Kembali ke Beranda
      </Link>
    </main>
  )
}