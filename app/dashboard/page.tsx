'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? null
      setEmail(e)
      setLoading(false)
      if (!e) window.location.href = '/login'
    })
  }, [])

  if (loading) return <p className="container py-10">Checking session…</p>

  return (
    <section className="container py-10 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Logged in as <strong>{email}</strong></p>
      <div className="flex gap-3">
        <Link href="/recommendations" className="btn btn-primary">Find something to watch</Link>
        <button
          className="btn btn-ghost"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
        >
          Sign out
        </button>
      </div>
    </section>
  )
}
