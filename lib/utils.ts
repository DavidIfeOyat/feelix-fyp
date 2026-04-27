// General-purpose utility kept separate from TMDb helpers.
// If no other file imports this, it is probably safe to remove and rely on the
// version already defined in lib/tmdb/tmdb.ts.

export const getCinemaLink = (title: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(title)}+showtimes+near+me`;