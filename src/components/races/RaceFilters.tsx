"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar, Check, MapPin, Ruler, Share2 } from "lucide-react";
import { useFiltersStore } from "@/store/filters";
import { getReferenceDate } from "@/lib/reference-date";
import { OriginPicker } from "@/components/map/OriginPicker";
import { FilterPill } from "@/components/races/FilterPill";
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

const CATEGORY_DOT: Record<RaceCategory, string> = {
  sprint: "#FF5A1F",
  endurance: "#2563EB",
  junior: "#16A34A",
  other: "#8B5CF6",
};

export function RaceFilters({ resultCount }: RaceFiltersProps) {
  const t = useTranslations();
  const locale = useLocale();
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
  const shortDateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const distanceActive = radiusKm < 2000;
  const distanceLabel = distanceActive ? `< ${radiusKm} km` : t("filters.noLimit");

  const datesActive = dateFrom !== null || dateTo !== null;
  const datesLabel = datesActive
    ? dateTo
      ? `${shortDateFormatter.format(new Date(effectiveDateFrom))} → ${shortDateFormatter.format(new Date(dateTo))}`
      : `${shortDateFormatter.format(new Date(effectiveDateFrom))} →`
    : t("filters.date");

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterPill
          id="race-filters-position"
          icon={MapPin}
          label={origin?.label ?? t("filters.myPosition")}
          active={origin !== null}
        >
          <OriginPicker />
        </FilterPill>

        <FilterPill
          id="race-filters-distance"
          icon={Ruler}
          label={distanceLabel}
          active={distanceActive}
          disabled={origin === null}
          disabledTitle={t("filters.needOrigin")}
        >
          <div role="radiogroup" aria-label={t("filters.distance")} className="flex flex-col gap-0.5">
            {RADIUS_OPTIONS_KM.map((km) => (
              <button
                key={km}
                type="button"
                role="radio"
                aria-checked={radiusKm === km}
                onClick={() => setRadiusKm(km)}
                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
                  radiusKm === km ? "bg-kart-50 text-kart-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {km === 2000 ? t("filters.noLimit") : `${km} km`}
                {radiusKm === km && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </FilterPill>

        <FilterPill
          id="race-filters-dates"
          icon={Calendar}
          label={datesLabel}
          active={datesActive}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-1">
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
            <button
              type="button"
              onClick={() => setDateRange(null, null)}
              className="self-start text-sm text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 rounded-lg"
            >
              {t("filters.reset")}
            </button>
          </div>
        </FilterPill>

        <div role="group" aria-label={t("filters.category")} className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((category) => {
            const active = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(category)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
                  active ? CATEGORY_ACTIVE_CLASSES[category] : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_DOT[category] }}
                  aria-hidden="true"
                />
                {t(`categories.${category}`)}
              </button>
            );
          })}
        </div>
      </div>

      {origin === null && <p className="text-xs text-slate-500">{t("filters.needOrigin")}</p>}

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium tabular-nums text-slate-700">
          {t("filters.results", { count: resultCount })}
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {t("filters.reset")}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("filters.share")}
          </button>
          <span aria-live="polite" className="text-xs text-green-700">
            {linkCopied ? t("filters.linkCopied") : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
