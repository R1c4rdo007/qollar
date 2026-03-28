import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://qollar.vercel.app";

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/community`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/vet`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
