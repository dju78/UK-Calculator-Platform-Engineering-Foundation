import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-xs no-print">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md">
            <span className="text-xl font-bold tracking-tight text-slate-950">
              UK Calculator Platform
            </span>
          </Link>
        </div>
        <nav aria-label="Main Navigation" className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-slate-950 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded px-2.5 py-1">
            Browse
          </Link>
        </nav>
      </div>
    </header>
  );
}
