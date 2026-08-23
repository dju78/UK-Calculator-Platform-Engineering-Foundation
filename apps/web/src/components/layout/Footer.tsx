import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-slate-50 py-8">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms of Use</Link></li>
              <li><Link href="/disclaimer" className="hover:underline">Disclaimer</Link></li>
              <li><Link href="/accessibility" className="hover:underline">Accessibility Statement</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3 text-sm text-slate-500">
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
