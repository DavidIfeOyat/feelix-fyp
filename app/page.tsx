import Link from 'next/link'

export default function Page() {
  return (
    <section className="container py-16 text-center">
      <h1 className="mx-auto max-w-4xl text-5xl sm:text-6xl font-extrabold leading-tight">
        Pick the perfect movie for <span className="text-[--color-brand]">your mood</span>
      </h1>
      <p className="mt-4 text-lg text-[--color-muted] max-w-2xl mx-auto">
        Choose your vibe, get smart recommendations, and see where to watch.
      </p>

      <div className="mt-8 flex gap-4 justify-center">
        <Link href="/onboarding" className="btn btn-primary px-6 py-3">Get Started</Link>
        <Link href="/#how" className="btn btn-ghost px-6 py-3">Learn more</Link>
      </div>

      <div id="features" className="mt-14 grid gap-6 sm:grid-cols-3 text-left">
        <Card title="Mood-based picks" text="Tell us your vibe and we’ll surface the best matches." />
        <Card title="Best deals" text="See where to stream, rent, or buy in your region." />
        <Card title="Watchlist" text="Save your shortlist and re-check prices later." />
      </div>

      <section id="how" className="mt-16 card p-8 text-left">
        <h2 className="text-2xl font-semibold mb-3">How it works</h2>
        <ol className="list-decimal list-inside space-y-2 text-[--color-muted]">
          <li>Pick your region and select moods/genres.</li>
          <li>We rank titles and show where to watch.</li>
          <li>Save to a watchlist or start watching.</li>
        </ol>
      </section>
    </section>
  )
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-[--color-muted]">{text}</p>
    </div>
  )
}
