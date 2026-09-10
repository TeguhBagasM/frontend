import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="text-slate-500">Halaman tidak ditemukan</p>
      <Link to="/" className="mt-4 font-medium text-blue-600">
        Kembali ke Beranda
      </Link>
    </main>
  )
}