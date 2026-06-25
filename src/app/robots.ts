import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://kiwiglobetours.co.nz";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api", "/checkout", "/booking"];
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // AI crawlers — explicit allow so they index tour and destination content
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Googlebot-Extended", allow: "/", disallow },
      { userAgent: "meta-externalagent", allow: "/", disallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
