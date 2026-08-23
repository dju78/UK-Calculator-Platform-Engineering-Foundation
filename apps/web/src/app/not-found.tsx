import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-4xl font-bold mb-4">Not Found</h2>
      <p className="text-slate-600 mb-6">Could not find requested calculator or page.</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
      >
        Return Home
      </Link>
    </div>
  )
}
