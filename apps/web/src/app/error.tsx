'use client'
 
import { useEffect } from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])
 
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-8 md:p-12 shadow-2xs max-w-2xl mx-auto text-center my-8">
      <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-4">Something went wrong!</h2>
      <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
        We encountered an unexpected error while processing your request. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
      >
        Try again
      </button>
    </div>
  )
}
