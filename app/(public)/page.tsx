import { createSupabaseServerReadOnly } from "@/lib/supabase/server";
import Hero from "@/components/home/Hero";
import FilmShelf from "@/components/home/FilmShelf";
import HomeFeatureGrid from "@/components/home/HomeFeatureGrid";
import HomeFinalCTA from "@/components/home/HomeFinalCTA";

export default async function HomePage() {
  const supabase = await createSupabaseServerReadOnly();
  const { data } = await supabase.auth.getUser();
  const isAuthed = !!data.user;

  return (
    <section className="container py-5 sm:py-8 md:py-10">
      <div className="grid gap-10 sm:gap-12 md:gap-16">
        <Hero isAuthed={isAuthed} />

        <HomeFeatureGrid isAuthed={isAuthed} />

        <FilmShelf
          title="Now Showing"
          subtitle="A current shelf of films drawing attention right now, presented more like a curated collection than a crowded feed."
          list="trending"
          browseHref="/films"
          isAuthed={isAuthed}
        />

        <FilmShelf
          title="Recently Added"
          subtitle="Newer titles to explore when you want something fresh without digging through endless pages."
          list="new"
          browseHref="/films"
          isAuthed={isAuthed}
        />

        <HomeFinalCTA isAuthed={isAuthed} />
      </div>
    </section>
  );
}