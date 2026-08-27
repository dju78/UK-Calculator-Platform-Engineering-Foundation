import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-slate-50 py-8 no-print">
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
            <h3 className="font-semibold mb-4">About</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/about" className="hover:underline">About</Link></li>
              <li><Link href="/for-organisations" className="hover:underline">For Organisations</Link></li>
              <li><Link href="/how-we-check-our-figures" className="hover:underline">How We Check Our Figures</Link></li>
              <li><Link href="/editorial-policy" className="hover:underline">Editorial Policy</Link></li>
              <li><Link href="/updates" className="hover:underline">Updates</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="hover:underline">Disclaimer</Link></li>
              <li><Link href="/commercial-disclosure" className="hover:underline">Commercial Disclosure</Link></li>
              <li><Link href="/accessibility" className="hover:underline">Accessibility Statement</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2 text-sm text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} UK Calculator Platform. All rights reserved.
            </p>
            <p className="mt-2">
              The calculators and information provided on this platform are for illustrative purposes only and do not constitute professional financial, tax, or legal advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
