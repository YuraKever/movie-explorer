/**
 * Public origin of this deployment, reused from BETTER_AUTH_URL: the app
 * already has to know the origin it is served from in order to issue session
 * cookies, and a second variable would only be one more thing to keep in sync.
 */
export const siteUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const siteName = "Movie Explorer";

export const siteDescription =
  "Browse and search movies powered by TMDB: trending, details, favorites.";
