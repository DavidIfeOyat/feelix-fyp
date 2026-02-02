'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SiteNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[--color-background]/80 backdrop-blur">
      <div className="container flex items-center justify-between py-3">
        <Link href="/" className="no-underline text-xl font-extrabold tracking-tight">
          <span className="opacity-90">feel</span><span className="text-[--color-brand]">IX</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-2">
          <NavLink href="/onboarding">Get Started</NavLink>
          <NavLink href="/recommendations">Discover</NavLink>
          <NavLink href="/login">Log in</NavLink>
          <Link href="/signup" className="no-underline btn btn-primary px-4 py-2">Sign up</Link>
        </nav>

        <button onClick={() => setOpen(!open)}
          className="sm:hidden inline-grid h-10 w-10 place-items-center rounded-xl bg-white/10 hover:bg-white/16 no-underline"
          aria-label="Toggle menu">☰</button>
      </div>

      {open && (
        <div className="sm:hidden border-t border-white/10 bg-[--color-background]">
          <div className="container py-2 flex flex-col">
            <Link className="no-underline px-3 py-2 hover:bg-white/10 rounded" href="/onboarding">Get Started</Link>
            <Link className="no-underline px-3 py-2 hover:bg-white/10 rounded" href="/recommendations">Discover</Link>
            <Link className="no-underline px-3 py-2 hover:bg-white/10 rounded" href="/login">Log in</Link>
            <Link className="no-underline mt-2 px-3 py-2 btn btn-primary rounded" href="/signup">Sign up</Link>
          </div>
        </div>
      )}
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="no-underline px-3 py-2 rounded-[--radius-xl] hover:bg-white/12">{children}</Link>
}
