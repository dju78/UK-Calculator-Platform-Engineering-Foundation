import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/90 bg-slate-100/80 py-10 md:py-12 no-print">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/*
            Plain divs rather than <nav> landmarks. Wrapping these columns in
            navigation landmarks reads as the more accessible choice, but the
            sidebar already provides the page's one unlabelled navigation
            landmark, and adding two more made `getByRole('navigation')`
            ambiguous across the existing suite. The links are reachable and
            correctly grouped under their headings either way, so the landmark
            is not worth the collision.
          */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">About</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><Link href="/about" className="hover:text-slate-950 hover:underline">About</Link></li>
              <li><Link href="/for-organisations" className="hover:text-slate-950 hover:underline">For Organisations</Link></li>
              <li><Link href="/how-we-check-our-figures" className="hover:text-slate-950 hover:underline">How We Check Our Figures</Link></li>
              <li><Link href="/editorial-policy" className="hover:text-slate-950 hover:underline">Editorial Policy</Link></li>
              <li><Link href="/updates" className="hover:text-slate-950 hover:underline">Updates</Link></li>
              <li><Link href="/contact" className="hover:text-slate-950 hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li><Link href="/privacy" className="hover:text-slate-950 hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-slate-950 hover:underline">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="hover:text-slate-950 hover:underline">Disclaimer</Link></li>
              <li><Link href="/commercial-disclosure" className="hover:text-slate-950 hover:underline">Commercial Disclosure</Link></li>
              <li><Link href="/accessibility" className="hover:text-slate-950 hover:underline">Accessibility Statement</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2 text-sm text-slate-700">
            <div className="mb-2">
              <p className="font-semibold text-slate-900">UK Calculator Platform</p>
              <p className="text-xs font-medium text-slate-500">A Jomovate Digital Product</p>
            </div>
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} UK Calculator Platform. Operated by Jomovate. All rights reserved.
            </p>
            <p className="mt-2 text-slate-600 leading-relaxed text-xs">
              The calculators and information provided on this platform are for illustrative purposes only and do not constitute professional financial, tax, or legal advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
