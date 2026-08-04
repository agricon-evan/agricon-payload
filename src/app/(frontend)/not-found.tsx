import Link from 'next/link'

export default async function RootNotFound() {
  return (
    <section className="min-h-[60vh] flex items-center justify-center px-6 py-20">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">404</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">Page not found</p>
        <Link href="/" className="inline-flex items-center justify-center mt-8 px-8 py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-md min-h-[48px]">
          Back to Home
        </Link>
      </div>
    </section>
  )
}
