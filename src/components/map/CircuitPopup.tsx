"use client";

import { Popup } from "react-map-gl/maplibre";
import { MapPin, Flag, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/Badge";
import { VisitToggle } from "@/components/passport/VisitToggle";
import { useTranslations } from "next-intl";
import type { Circuit } from "@/types/circuit";
import type { Race } from "@/types/race";

interface CircuitPopupProps {
  circuit: Circuit;
  upcoming: Race[]; // déjà filtrées/triées, ce composant en affiche max 3
  locale: string;
  onClose(): void;
}

const MAX_RACES_SHOWN = 3;

const CATEGORY_BADGE_VARIANT = {
  sprint: "sprint",
  endurance: "endurance",
  junior: "junior",
  other: "special",
} as const;

export function CircuitPopup({ circuit, upcoming, locale, onClose }: CircuitPopupProps) {
  const t = useTranslations();
  const races = upcoming.slice(0, MAX_RACES_SHOWN);

  return (
    <Popup
      longitude={circuit.lng}
      latitude={circuit.lat}
      anchor="bottom"
      closeButton={false}
      offset={16}
      onClose={onClose}
    >
      <div className="flex w-64 flex-col gap-2 p-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-base font-semibold text-slate-900">
            {circuit.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="rounded-lg p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>
            {circuit.city}, {circuit.country}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-slate-700">
          <Flag className="h-3.5 w-3.5" />
          <span>{t("map.upcomingCount", { count: upcoming.length })}</span>
        </div>

        {races.length > 0 ? (
          <ul className="flex flex-col gap-1.5 border-t border-slate-200 pt-2">
            {races.map((race) => (
              <li key={race.id} className="flex items-center gap-2 text-sm">
                <Badge variant={CATEGORY_BADGE_VARIANT[race.category]}>
                  {t(`categories.${race.category}`)}
                </Badge>
                <span className="text-slate-600">
                  {new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(
                    new Date(race.date)
                  )}
                </span>
                {race.price !== null && (
                  <span className="ml-auto tabular-nums text-slate-900">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: race.currency,
                    }).format(race.price)}
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
