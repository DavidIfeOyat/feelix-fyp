import './globals.css'
import type { ReactNode } from 'react'
import SiteNav from '../components/SiteNav'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[--color-background] text-[--color-foreground]">
        <SiteNav />
        <main id="main" className="min-h-[calc(100vh-160px)]">{children}</main>
      </body>
    </html>
  )
}
