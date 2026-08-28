import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "UKCalc Management Console",
  description: "Private operational and governance console for the UK Calculator Platform.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className="h-full">
      <body className="h-full bg-slate-100 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}