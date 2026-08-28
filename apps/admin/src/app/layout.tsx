import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UK Calculator Platform Management Console",
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
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}

