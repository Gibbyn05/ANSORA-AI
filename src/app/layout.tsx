import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ansora – AI-drevet rekruttering',
  description: 'Moderne, AI-drevet rekrutteringsplattform som forenkler prosessen for både bedrifter og kandidater.',
  keywords: 'rekruttering, AI, jobb, stillinger, kandidater, intervju',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="no">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-light min-h-screen">
        {children}
      </body>
    </html>
  )
}
