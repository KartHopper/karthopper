"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RaceCard } from "@/components/races/RaceCard";
import { distanceToCircuit, type RaceEvent } from "@/lib/races";
import type { Circuit } from "@/types/circuit";
import type { LatLng } from "@/lib/geo";

interface RaceListProps {
  events: RaceEvent[]; // déjà filtrés + triés
  circuits: Map<number, Circuit>;
  origin: LatLng | null;
  locale: string;
  selectedCircuitId: number | null;
  onSelectCircuit(id: number): void;
}

const PAGE_SIZE = 100;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function RaceList({
  events,
  circuits,
  origin,
  locale,
  selectedCircuitId,
  onSelectCircuit,
}: RaceListProps) {
  const t = useTranslations();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const visibleEvents = events.slice(0, limit);

  useEffect(() => {
    if (selectedCircuitId === null) return;
    const match = visibleEvents.find((event) => event.circuit_id === selectedCircuitId);
    if (!match) return;

    itemRefs.current[match.key]?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne veut réagir qu'au changement de sélection
  }, [selectedCircuitId]);

  return (
    <ul className="flex flex-col gap-3">
      {visibleEvents.map((event) => {
        const circuit = circuits.get(event.circuit_id);
        return (
          <li key={event.key} ref={(el) => { itemRefs.current[event.key] = el; }}>
            <RaceCard
              race={event.representative}
              circuit={circuit}
              distanceKm={distanceToCircuit(origin, circuit)}
              locale={locale}
              mancheCount={event.mancheCount}
              selected={selectedCircuitId === event.circuit_id}
              onSelect={() => onSelectCircuit(event.circuit_id)}
            />
          </li>
        );
      })}

      {limit < events.length && (
        <li>
          <button
            type="button"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {t("filters.showMore", { count: Math.min(PAGE_SIZE, events.length - limit) })}
          </button>
        </li>
      )}
    </ul>
  );
}
