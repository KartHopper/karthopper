"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useFiltersStore } from "@/store/filters";
import type { RaceCategory } from "@/types/race";

const ALLOWED_RADII_KM: number[] = [50, 100, 200, 500, 1000, 2000];
const ALLOWED_CATEGORIES: RaceCategory[] = ["sprint", "endurance", "junior", "other"];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRaceCategory(value: string): value is RaceCategory {
  return (ALLOWED_CATEGORIES as string[]).includes(value);
}

/** Synchronise les filtres de /map avec les query params — pas de rendu. */
export function UrlFiltersSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hydrateFromUrl = useFiltersStore((state) => state.hydrateFromUrl);
  const origin = useFiltersStore((state) => state.origin);
  const radiusKm = useFiltersStore((state) => state.radiusKm);
  const dateFrom = useFiltersStore((state) => state.dateFrom);
  const dateTo = useFiltersStore((state) => state.dateTo);
  const categories = useFiltersStore((state) => state.categories);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const partial: Parameters<typeof hydrateFromUrl>[0] = {};

    const lat = Number.parseFloat(searchParams.get("lat") ?? "");
    const lng = Number.parseFloat(searchParams.get("lng") ?? "");
    const loc = searchParams.get("loc");
    if (Number.isFinite(lat) && Number.isFinite(lng) && loc) {
      partial.origin = { lat, lng, label: loc };
    }

    const radius = Number.parseInt(searchParams.get("r") ?? "", 10);
    if (ALLOWED_RADII_KM.includes(radius)) {
      partial.radiusKm = radius;
    }

    const from = searchParams.get("from");
    if (from && ISO_DATE_RE.test(from)) partial.dateFrom = from;

    const to = searchParams.get("to");
    if (to && ISO_DATE_RE.test(to)) partial.dateTo = to;

    const cat = searchParams.get("cat");
    if (cat) {
      const parsedCategories = cat.split(",").filter(isRaceCategory);
      if (parsedCategories.length > 0) partial.categories = parsedCategories;
    }

    if (Object.keys(partial).length > 0) hydrateFromUrl(partial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydratation unique au montage
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();

      if (origin) {
        params.set("lat", origin.lat.toFixed(4));
        params.set("lng", origin.lng.toFixed(4));
        params.set("loc", origin.label);
      }
      if (radiusKm !== 2000) params.set("r", String(radiusKm));
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      if (categories.length > 0) params.set("cat", categories.join(","));

      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, "", url);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, origin, radiusKm, dateFrom, dateTo, categories]);

  return null;
}
