"use client";

import { useTranslations } from "next-intl";
import { Calendar, CalendarPlus, Car, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/Badge";
import { getReferenceDate } from "@/lib/reference-date";
import { buildRaceIcs } from "@/lib/ics";
import type { Race } from "@/types/race";
import type { Circuit } from "@/types/circuit";

interface RaceCardProps {
  race: Race;
  circuit: Circuit | undefined;
  distanceKm: number | null;
  locale: string;
  selected: boolean;
  onSelect?: () => void;
}

const CATEGORY_BADGE_VARIANT = {
  sprint: "sprint",
  endurance: "endurance",
  junior: "junior",
  other: "special",
} as const;

const HOURS_48 = 48 * 60 * 60 * 1000;
const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

interface SpotsInfo {
  taken: number;
  total: number;
  pct: number;
  isFull: boolean;
  isAlmostFull: boolean;
}

function getSpotsInfo(race: Race): SpotsInfo | null {
  if (race.spots_total === null || race.spots_taken === null) return null;
  const pct = Math.round((race.spots_taken / race.spots_total) * 100);
  return {
    taken: race.spots_taken,
    total: race.spots_total,
    pct,
    isFull: pct >= 100,
    isAlmostFull: pct >= 80 && pct < 100,
  };
}

function getDeadlineBadge(
  deadline: string | null,
  referenceDate: string
): { variant: "full" | "almost-full"; days: number } | null {
  if (!deadline) return null;

  const deadlineTime = new Date(deadline).getTime();
  if (Number.isNaN(deadlineTime)) return null;

  const referenceTime = new Date(referenceDate).getTime();
  const diff = deadlineTime - referenceTime;

  if (diff < 0) return null;
  if (diff <= HOURS_48) return { variant: "full", days: 1 };
  if (diff <= DAYS_7) return { variant: "almost-full", days: Math.ceil(diff / (24 * 60 * 60 * 1000)) };
  return null;
}

export function RaceCard({ race, circuit, distanceKm, locale, selected, onSelect }: RaceCardProps) {
  const t = useTranslations();
  const deadlineBadge = getDeadlineBadge(race.deadline, getReferenceDate());
  const spotsInfo = getSpotsInfo(race);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" && onSelect) onSelect();
  }

  function handleAddToCalendar(event: React.MouseEvent) {
    event.stopPropagation();
    const blob = new Blob([buildRaceIcs(race, circuit)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `karthopper-${race.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <article
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={onSelect ? 0 : undefined}
      className={`cursor-pointer rounded-lg bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
        selected ? "ring-2 ring-kart-500" : ""
      } ${spotsInfo?.isFull ? "opacity-75" : ""}`}
    >
      <div className="flex items-start gap-2">
        <Badge variant={CATEGORY_BADGE_VARIANT[race.category]}>
          {t(`categories.${race.category}`)}
        </Badge>
        {race.track_type && (
          <Badge variant={race.track_type}>{t(`circuit.${race.track_type}`)}</Badge>
        )}
        <h3 className="line-clamp-2 font-heading text-base font-medium text-slate-900">
          {race.title}
        </h3>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        {circuit ? `${circuit.name} · ${circuit.city}, ${circuit.country}` : race.slug}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-sm text-slate-700">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          {new Intl.DateTimeFormat(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(race.date))}
        </span>
        {race.kart_model && (
          <span className="flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5" aria-hidden="true" />
            {race.kart_model}
          </span>
        )}
        {distanceKm !== null && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{distanceKm} km</span>
          </span>
        )}
        {race.timing && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {race.timing}
          </span>
        )}
      </div>

      {spotsInfo && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-sm text-slate-700">
            <span className="tabular-nums">
              {spotsInfo.taken}/{spotsInfo.total}
            </span>
            <span className="tabular-nums">{spotsInfo.pct}%</span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={spotsInfo.taken}
            aria-valuemax={spotsInfo.total}
            aria-valuemin={0}
            aria-label={t("race.spots", { taken: spotsInfo.taken, total: spotsInfo.total })}
            className="mt-1 h-1.5 w-full rounded-full bg-slate-100"
          >
            <div
              className={`h-1.5 rounded-full ${
                spotsInfo.isFull ? "bg-red-600" : spotsInfo.isAlmostFull ? "bg-yellow-500" : "bg-kart-500"
              }`}
              style={{ width: `${Math.min(spotsInfo.pct, 100)}%` }}
            />
          </div>
          {spotsInfo.isAlmostFull && (
            <div className="mt-1.5">
              <Badge variant="almost-full">
                {t("race.spotsLeft", { count: spotsInfo.total - spotsInfo.taken })}
              </Badge>
            </div>
          )}
          {spotsInfo.isFull && (
            <div className="mt-1.5">
              <Badge variant="full">{t("race.full")}</Badge>
            </div>
          )}
        </div>
      )}

      {deadlineBadge && (
        <div className="mt-2">
          <Badge variant={deadlineBadge.variant}>
            {deadlineBadge.variant === "full"
              ? t("race.closesTomorrow")
              : t("race.closesInDays", { count: deadlineBadge.days })}
          </Badge>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {race.price !== null && (
          <span className="text-lg font-semibold tabular-nums text-slate-900">
            {new Intl.NumberFormat(locale, {
              style: "currency",
              currency: race.currency,
            }).format(race.price)}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={handleAddToCalendar}
            aria-label={t("race.addToCalendar")}
            title={t("race.addToCalendar")}
            className="rounded-lg p-1.5 text-kart-700 hover:bg-kart-50 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          </button>
          {spotsInfo?.isFull ? (
            <span className="rounded-lg px-2 py-1 text-sm font-medium text-slate-400">
              {t("race.registerOnSws")}
            </span>
          ) : (
            <a
              href={race.sws_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="rounded-lg px-2 py-1 text-sm font-medium text-kart-700 hover:bg-kart-50 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
            >
              {t("race.registerOnSws")}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
