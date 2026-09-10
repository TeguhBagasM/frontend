type ComingSoonProps = {
  page: string
}

export default function ComingSoon({ page }: ComingSoonProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-50">
      <h1 className="text-3xl font-semibold text-slate-900">{page}</h1>
      <p className="text-slate-500">Coming Soon</p>
    </main>
  )
}