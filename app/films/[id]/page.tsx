import Link from "next/link";
import FilmDetailActionBar from "@/components/features/films/FilmDetailActionBar";
import {
  backdropUrl,
  getCinemaLink,
  getJustWatchSearchLink,
  getMovie,
  getVideos,
  getWatchProviders,
  mapProviders,
  pickTrailer,
  posterUrl,
  region,
  type ProviderItem,
} from "@/lib/tmdb/tmdb";

function actionBtn(variant: "primary" | "ghost" = "ghost") {
  return variant === "primary" ? "btn btn-primary" : "btn btn-ghost";
}

function tabBtn(active: boolean) {
  return [
    "border-2 border-black px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] transition",
    active
      ? "bg-black text-[var(--background)]"
      : "bg-transparent text-[var(--foreground)] hover:bg-black hover:text-[var(--background)]",
  ].join(" ");
}

function isRecentRelease(releaseDate: string | null) {
  if (!releaseDate) return false;
  const date = new Date(releaseDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000;
}

export default async function FilmDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }> | { tab?: string };
}) {
  const { id: raw } = await params;
  const id = Number(raw);

  const sp = (searchParams instanceof Promise ? await searchParams : searchParams) ?? {};
  const tab = sp.tab === "trailer" ? "trailer" : "stream";

  if (!Number.isFinite(id)) {
    return (
      <section className="container py-8 sm:py-10">
        <div className="border-2 border-black bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--foreground)]">Invalid film id.</p>
          <Link className="btn btn-ghost mt-4" href="/films">
            Back to Films
          </Link>
        </div>
      </section>
    );
  }

  const [movie, videos, providers] = await Promise.all([
    getMovie(id),
    getVideos(id),
    getWatchProviders(id),
  ]);

  const prov = mapProviders(providers, region);
  const trailerUrl = pickTrailer(videos);
  const trailerExternalHref = trailerUrl ? trailerUrl.replace("/embed/", "/watch?v=") : null;

  const title = movie?.title ?? "Film";
  const poster = posterUrl(movie?.poster_path, "w500");
  const backdrop = backdropUrl(movie?.backdrop_path, "original");
  const overview = typeof movie?.overview === "string" ? movie.overview : "";
  const runtime = movie?.runtime ? `${movie.runtime} min` : "—";
  const releaseDate = typeof movie?.release_date === "string" ? movie.release_date : null;
  const releaseYear = releaseDate?.slice(0, 4) ?? null;
  const rating =
    typeof movie?.vote_average === "number" && movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : null;

  const genres = Array.isArray(movie?.genres)
    ? movie.genres
        .map((genre: { name?: string }) => genre?.name)
        .filter(Boolean)
        .join(", ")
    : "—";

  const genreIds = Array.isArray(movie?.genres)
    ? movie.genres
        .map((genre: { id?: number }) => Number(genre?.id))
        .filter(Number.isFinite)
    : [];

  const providerLink = prov.link || getJustWatchSearchLink(title, region);
  const cinemaLink = getCinemaLink(title);
  const hasProviders = prov.stream.length + prov.rent.length + prov.buy.length > 0;
  const recentRelease = isRecentRelease(releaseDate);

  return (
    <section className="container py-6 sm:py-8 md:py-10">
      <div className="grid gap-6">
        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="border-b-2 border-black px-5 py-4 sm:px-6">
            <Link
              href="/films"
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)] underline-offset-4 hover:underline"
            >
              Back to Films
            </Link>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr]">
            <div className="border-b-2 border-black bg-[var(--surface-strong)] p-5 sm:p-6 lg:border-b-0 lg:border-r-2">
              <div className="overflow-hidden border-2 border-black bg-[var(--surface)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt={title} className="aspect-[2/3] w-full object-cover" />
              </div>

              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Collection Entry
                </p>
                <h1 className="mt-3 text-3xl font-extrabold uppercase leading-[0.92] tracking-[-0.06em] text-[var(--foreground)] sm:text-4xl">
                  {title}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="border border-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                    {runtime}
                  </span>
                  {releaseYear ? (
                    <span className="border border-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                      {releaseYear}
                    </span>
                  ) : null}
                  {rating ? (
                    <span className="border border-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em]">
                      Rating {rating}
                    </span>
                  ) : null}
                </div>

                <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{genres}</p>
              </div>
            </div>

            <div className="grid">
              <div className="border-b-2 border-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={backdrop}
                  alt=""
                  className="h-[220px] w-full object-cover sm:h-[280px] md:h-[340px]"
                />
              </div>

              <div className="grid gap-6 p-5 sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Film overview
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--foreground)] sm:text-base">
                    {overview || "No overview is available for this film right now."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
                  <Link className={actionBtn("primary")} href={`/films/${id}?tab=trailer`}>
                    Play Trailer
                  </Link>

                  {!hasProviders && recentRelease ? (
                    <a
                      href={cinemaLink}
                      target="_blank"
                      rel="noreferrer"
                      className={actionBtn("ghost")}
                    >
                      Find in Cinemas
                    </a>
                  ) : (
                    <Link className={actionBtn("ghost")} href={`/films/${id}?tab=stream`}>
                      Where to Watch
                    </Link>
                  )}
                </div>

                <div className="border-t-2 border-black pt-5">
                  <FilmDetailActionBar
                    tmdbId={id}
                    title={title}
                    poster={poster}
                    genreIds={genreIds}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-2 border-black bg-[var(--surface)]">
          <div className="grid grid-cols-2 border-b-2 border-black">
            <Link href={`/films/${id}?tab=stream`} className={tabBtn(tab === "stream")}>
              Where to Watch
            </Link>

            <Link href={`/films/${id}?tab=trailer`} className={tabBtn(tab === "trailer")}>
              Trailer
            </Link>
          </div>

          {tab === "trailer" ? (
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-3 border-b-2 border-black pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                    Video
                  </p>
                  <h2 className="mt-2 text-3xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
                    Trailer
                  </h2>
                </div>

                {trailerExternalHref ? (
                  <a
                    href={trailerExternalHref}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost sm:w-auto"
                  >
                    Open on YouTube
                  </a>
                ) : null}
              </div>

              <div className="mt-5 overflow-hidden border-2 border-black bg-[var(--surface-strong)]">
                {trailerUrl ? (
                  <div className="aspect-video">
                    <iframe
                      src={trailerUrl}
                      title="Trailer"
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="grid min-h-[220px] place-items-center px-6 text-center text-sm text-[var(--muted)]">
                    No trailer is available for this film right now.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <div className="border-b-2 border-black pb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Availability
                </p>
                <h2 className="mt-2 text-3xl font-extrabold uppercase leading-none tracking-[-0.05em] text-[var(--foreground)]">
                  Streaming Providers
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Availability is provided by TMDB for region {region}.
                </p>
              </div>

              <ProviderRow title="Stream" items={prov.stream} href={providerLink} />
              <ProviderRow title="Rent" items={prov.rent} href={providerLink} />
              <ProviderRow title="Buy" items={prov.buy} href={providerLink} />

              {!hasProviders ? (
                <div className="mt-6 border-2 border-black bg-[var(--surface-strong)] p-4 sm:p-5">
                  {recentRelease ? (
                    <div className="grid gap-3">
                      <p className="text-sm leading-7 text-[var(--foreground)]">
                        Not yet on streaming. This title may still be in cinemas.
                      </p>
                      <a
                        href={cinemaLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary sm:w-fit"
                      >
                        Find Showtimes Near Me
                      </a>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      <p className="text-sm leading-7 text-[var(--foreground)]">
                        No providers were found for this region.
                      </p>
                      <a
                        href={providerLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost sm:w-fit"
                      >
                        Search Where to Watch
                      </a>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ProviderRow({
  title,
  items,
  href,
}: {
  title: string;
  items: ProviderItem[];
  href: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-6 border-b border-black pb-6 last:border-b-0 last:pb-0">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--muted)]">
            Provider group
          </p>
          <h3 className="mt-2 text-xl font-extrabold uppercase leading-none tracking-[-0.04em] text-[var(--foreground)]">
            {title}
          </h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <a
            key={`${title}-${item.id}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="grid gap-3 border-2 border-black bg-[var(--surface)] p-3 transition hover:bg-black hover:text-[var(--background)]"
          >
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.logo}
                alt={item.name}
                className="h-8 w-8 border border-black object-cover"
              />
              <span className="truncate text-[11px] font-bold uppercase tracking-[0.14em]">
                {item.name}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}