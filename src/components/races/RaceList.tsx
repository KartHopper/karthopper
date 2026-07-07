"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { RaceCard } from "@/components/races/RaceCard";
import { distanceToCircuit } from "@/lib/races";
import type { Race } from "@/types/race";
import type { Circuit } from "@/types/circuit";
import type { LatLng } from "@/lib/geo";

interface RaceListProps {
  races: Race[]; // déjà filtrées + triées
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
  races,
  circuits,
  origin,
  locale,
  selectedCircuitId,
  onSelectCircuit,
}: RaceListProps) {
  const t = useTranslations();
  const [limit, setLimit] = useState(PAGE_SIZE);
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const visibleRaces = races.slice(0, limit);

  useEffect(() => {
    if (selectedCircuitId === null) return;
    const match = visibleRaces.find((race) => race.circuit_id === selectedCircuitId);
    if (!match) return;

    itemRefs.current[match.id]?.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on ne veut réagir qu'au changement de sélection
  }, [selectedCircuitId]);

  return (
    <ul className="flex flex-col gap-3">
      {visibleRaces.map((race) => {
        const circuit = circuits.get(race.circuit_id);
        return (
          <li key={race.id} ref={(el) => { itemRefs.current[race.id] = el; }}>
            <RaceCard
              race={race}
              circuit={circuit}
              distanceKm={distanceToCircuit(origin, circuit)}
              locale={locale}
              selected={selectedCircuitId === race.circuit_id}
              onSelect={() => onSelectCircuit(race.circuit_id)}
            />
          </li>
        );
      })}

      {limit < races.length && (
        <li>
          <button
            type="button"
            onClick={() => setLimit((value) => value + PAGE_SIZE)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {t("filters.showMore", { count: Math.min(PAGE_SIZE, races.length - limit) })}
          </button>
        </li>
      )}
    </ul>
  );
}
