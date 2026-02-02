'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <section className="container py-16 grid place-items-center">
      <div className="w-full max-w-md rounded-xl border border-[#5179A1]/40 bg-[--color-surface] p-6 shadow-[0_18px_50px_rgba(0,0,0,.42)]">
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        <p className="text-center text-[--color-muted] mt-1">
          Log in to access your watchlist and preferences.
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#5179A1]/40 bg-[#1b3048] px-3 py-2 placeholder-white/60"
            />
          </div>
          <div>
            <label className="block mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#5179A1]/40 bg-[#1b3048] px-3 py-2 placeholder-white/60"
            />
          </div>

        <button
          type="button"
          className="w-full px-4 py-2 rounded-xl border border-[#5179A1]/50 bg-[--color-brand] text-white hover:opacity-90"
        >
          Log In
        </button>
        </form>

        <p className="mt-4 text-center text-sm text-[--color-muted]">
          No account?{' '}
          <Link href="/signup" className="text-white hover:opacity-90">Sign up</Link>
        </p>
      </div>
    </section>
  )
}
