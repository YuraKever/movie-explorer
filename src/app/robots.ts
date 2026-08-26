import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Everything behind a session, plus the API, is worthless in an index: the
 * crawler is signed out, so it would only ever see the redirect or a 401.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/register", "/favorites", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
