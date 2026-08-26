import type { MetadataRoute } from "next";
import { tmdbFetch } from "@/lib/tmdb";
import { siteUrl } from "@/lib/site";
import type { Movie, PaginatedResponse } from "@/features/movies/types";

/**
 * Static routes plus this week's trending movies — the detail pages are the
 * only ones worth indexing individually, and there are far too many to list
 * them all. TMDB being down degrades the sitemap instead of failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/discover`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/search`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const trending = await tmdbFetch<PaginatedResponse<Movie>>(
    "trending/movie/week",
  ).catch(() => null);

  const movies = (trending?.results ?? []).map((movie) => ({
    url: `${siteUrl}/movie/${movie.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...movies];
}
