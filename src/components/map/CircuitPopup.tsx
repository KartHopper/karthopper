"use client";

import { Popup } from "react-map-gl/maplibre";
import { MapPin, Flag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/Badge";
import { VisitToggle } from "@/components/passport/VisitToggle";
import { useTranslations } from "next-intl";
import type { Circuit } from "@/types/circuit";
import type { RaceEvent } from "@/lib/races";

interface CircuitPopupProps {
  circuit: Circuit;
  events: RaceEvent[]; // déjà filtrés/triés, ce composant en affiche max 3
  locale: string;
  onClose(): void;
}

const MAX_EVENTS_SHOWN = 3;

const CATEGORY_BADGE_VARIANT = {
  sprint: "sprint",
  endurance: "endurance",
  junior: "junior",
  other: "special",
} as const;

export function CircuitPopup({ circuit, events, locale, onClose }: CircuitPopupProps) {
  const t = useTranslations();
  const shownEvents = events.slice(0, MAX_EVENTS_SHOWN);

  return (
    <Popup
      longitude={circuit.lng}
      latitude={circuit.lat}
      anchor="bottom"
      closeButton={false}
      offset={16}
      maxWidth="none"
      onClose={onClose}
    >
      <div className="flex w-64 max-w-[calc(100vw-2rem)] flex-col gap-2 p-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 wrap-break-word font-heading text-base font-semibold text-slate-900">
            {circuit.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {circuit.city}, {circuit.country}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-700">
          <Flag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t("map.upcomingCount", { count: events.length })}</span>
        </div>

        {shownEvents.length > 0 ? (
          <ul className="flex flex-col gap-1.5 border-t border-slate-200 pt-2">
            {shownEvents.map((event) => (
              <li key={event.key} className="flex items-center gap-2 text-sm">
                <Badge variant={CATEGORY_BADGE_VARIANT[event.category]}>
                  {t(`categories.${event.category}`)}
                </Badge>
                <span className="min-w-0 truncate text-slate-600">
                  {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
                    new Date(event.date)
                  )}
                  {event.mancheCount > 1 && ` · ${t("race.manches", { count: event.mancheCount })}`}
                </span>
                {event.representative.price !== null && (
                  <span className="ml-auto shrink-0 tabular-nums text-slate-900">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: event.representative.currency,
                    }).format(event.representative.price)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">{t("map.noUpcoming")}</p>
        )}

        <Link
          href={`/circuit/${circuit.slug}`}
          className="mt-1 text-sm font-medium text-kart-700 hover:underline focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          {t("map.viewCircuit")}
        </Link>

        <VisitToggle circuitId={circuit.id} size="sm" />
      </div>
    </Popup>
  );
}
