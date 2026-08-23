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
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-slate-600 mb-6 max-w-md">
        We encountered an unexpected error while processing your request. Please try again.
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
