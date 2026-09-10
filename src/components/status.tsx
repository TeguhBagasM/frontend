export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto w-full max-w-md py-16 text-center">
      <h2 className="text-xl font-semibold text-red-700">Terjadi Kesalahan</h2>
      <p className="mt-2 text-slate-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="mx-auto w-full max-w-md py-16 text-center">
      <p className="text-slate-500">{message}</p>
    </div>
  )
}