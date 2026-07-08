import type { MetadataRoute } from "next";
import { loadCircuits } from "@/lib/data";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://karthopper.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const circuits = loadCircuits();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/fr`,
      alternates: { languages: { fr: `${BASE_URL}/fr`, en: `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/en`,
      alternates: { languages: { fr: `${BASE_URL}/fr`, en: `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/fr/map`,
      changeFrequency: "daily",
      alternates: { languages: { fr: `${BASE_URL}/fr/map`, en: `${BASE_URL}/en/map` } },
    },
    {
      url: `${BASE_URL}/en/map`,
      changeFrequency: "daily",
      alternates: { languages: { fr: `${BASE_URL}/fr/map`, en: `${BASE_URL}/en/map` } },
    },
  ];

  const circuitEntries: MetadataRoute.Sitemap = circuits.flatMap((circuit) => {
    const frUrl = `${BASE_URL}/fr/circuit/${circuit.slug}`;
    const enUrl = `${BASE_URL}/en/circuit/${circuit.slug}`;
    const alternates = { languages: { fr: frUrl, en: enUrl } };

    return [
      { url: frUrl, changeFrequency: "weekly" as const, alternates },
      { url: enUrl, changeFrequency: "weekly" as const, alternates },
    ];
  });

  return [...staticEntries, ...circuitEntries];
}
