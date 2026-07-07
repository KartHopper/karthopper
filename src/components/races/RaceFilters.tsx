"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Share2 } from "lucide-react";
import { useFiltersStore } from "@/store/filters";
import { getReferenceDate } from "@/lib/reference-date";
import { OriginPicker } from "@/components/map/OriginPicker";
import type { RaceCategory } from "@/types/race";

interface RaceFiltersProps {
  resultCount: number;
}

const RADIUS_OPTIONS_KM = [50, 100, 200, 500, 1000, 2000] as const;
const CATEGORIES: RaceCategory[] = ["sprint", "endurance", "junior", "other"];

const CATEGORY_ACTIVE_CLASSES: Record<RaceCategory, string> = {
  sprint: "bg-kart-50 text-kart-700 border-kart-500",
  endurance: "bg-blue-100 text-blue-700 border-blue-600",
  junior: "bg-green-100 text-green-700 border-green-600",
  other: "bg-violet-100 text-violet-700 border-violet-600",
};

export function RaceFilters({ resultCount }: RaceFiltersProps) {
  const t = useTranslations();
  const origin = useFiltersStore((state) => state.origin);
  const radiusKm = useFiltersStore((state) => state.radiusKm);
  const dateFrom = useFiltersStore((state) => state.dateFrom);
  const dateTo = useFiltersStore((state) => state.dateTo);
  const categories = useFiltersStore((state) => state.categories);
  const setRadiusKm = useFiltersStore((state) => state.setRadiusKm);
  const setDateRange = useFiltersStore((state) => state.setDateRange);
  const toggleCategory = useFiltersStore((state) => state.toggleCategory);
  const resetFilters = useFiltersStore((state) => state.resetFilters);
  const [linkCopied, setLinkCopied] = useState(false);

  const effectiveDateFrom = dateFrom ?? getReferenceDate();

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <OriginPicker />

      <div className="flex flex-col gap-1">
        <label htmlFor="race-filters-radius" className="text-sm font-medium text-slate-700">
          {t("filters.distance")}
        </label>
        <select
          id="race-filters-radius"
          value={radiusKm}
          disabled={origin === null}
          onChange={(event) => setRadiusKm(Number(event.target.value))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {RADIUS_OPTIONS_KM.map((km) => (
            <option key={km} value={km}>
              {km === 2000 ? t("filters.noLimit") : `${km} km`}
            </option>
          ))}
        </select>
        {origin === null && <p className="text-xs text-slate-400">{t("filters.needOrigin")}</p>}
      </div>

      <div className="flex gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="race-filters-date-from" className="text-sm font-medium text-slate-700">
            {t("filters.dateFrom")}
          </label>
          <input
            id="race-filters-date-from"
            type="date"
            value={effectiveDateFrom}
            onChange={(event) => setDateRange(event.target.value, dateTo)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="race-filters-date-to" className="text-sm font-medium text-slate-700">
            {t("filters.dateTo")}
          </label>
          <input
            id="race-filters-date-to"
            type="date"
            value={dateTo ?? ""}
            min={effectiveDateFrom}
            onChange={(event) => setDateRange(dateFrom, event.target.value || null)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div role="group" aria-labelledby="race-filters-category-label" className="flex flex-col gap-1">
        <span id="race-filters-category-label" className="text-sm font-medium text-slate-700">
          {t("filters.category")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const active = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(category)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
                  active ? CATEGORY_ACTIVE_CLASSES[category] : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {t(`categories.${category}`)}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        {t("filters.reset")}
      </button>

      <p className="text-sm font-medium tabular-nums text-slate-700">
        {t("filters.results", { count: resultCount })}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          <Share2 className="h-3.5 w-3.5" />
          {t("filters.share")}
        </button>
        <span aria-live="polite" className="text-xs text-green-700">
          {linkCopied ? t("filters.linkCopied") : ""}
        </span>
      </div>
    </div>
  );
}
