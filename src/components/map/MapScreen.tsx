"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useKarthopperData } from "@/hooks/use-karthopper-data";
import { getReferenceDate } from "@/lib/reference-date";
import { applyFilters, circuitById, racesByCircuitId, upcomingRaces } from "@/lib/races";
import { useFiltersStore } from "@/store/filters";
import { MapView } from "@/components/map/MapView";
import { CircuitPopup } from "@/components/map/CircuitPopup";
import { RaceFilters } from "@/components/races/RaceFilters";
import { RaceList } from "@/components/races/RaceList";

export function MapScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const { circuits, races, loading, error, retry } = useKarthopperData();
  const origin = useFiltersStore((state) => state.origin);
  const radiusKm = useFiltersStore((state) => state.radiusKm);
  const dateFrom = useFiltersStore((state) => state.dateFrom);
  const dateTo = useFiltersStore((state) => state.dateTo);
  const categories = useFiltersStore((state) => state.categories);
  const selectedCircuitId = useFiltersStore((state) => state.selectedCircuitId);
  const setSelectedCircuitId = useFiltersStore((state) => state.setSelectedCircuitId);
  const [flyToCircuitId, setFlyToCircuitId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="h-full w-full animate-pulse bg-slate-100 motion-reduce:animate-none" />
    );
  }

  if (error || !circuits || !races) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-slate-500">{t("common.error")}</p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-kart-500 px-4 py-2 text-sm font-medium text-white hover:bg-kart-400 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const referenceDate = getReferenceDate();
  const upcoming = upcomingRaces(races, referenceDate);
  const circuitsById = circuitById(circuits);
  const racesByCircuit = racesByCircuitId(upcoming);
  const upcomingCountByCircuit = new Map(
    Array.from(racesByCircuit.entries()).map(([id, list]) => [id, list.length])
  );
  const filtered = applyFilters(upcoming, circuitsById, {
    origin,
    radiusKm,
    dateFrom: dateFrom ?? referenceDate,
    dateTo,
    categories,
  });
  const selectedCircuit =
    selectedCircuitId !== null ? circuitsById.get(selectedCircuitId) : undefined;

  function handleSelectFromList(circuitId: number) {
    setSelectedCircuitId(circuitId);
    setFlyToCircuitId(circuitId);
  }

  return (
    <div className="flex h-full w-full">
      <aside className="hidden w-[380px] shrink-0 flex-col lg:flex">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <RaceFilters resultCount={filtered.length} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <RaceList
            races={filtered}
            circuits={circuitsById}
            origin={origin}
            locale={locale}
            selectedCircuitId={selectedCircuitId}
            onSelectCircuit={handleSelectFromList}
          />
        </div>
      </aside>

      <div className="relative flex-1">
        <MapView
          circuits={circuits}
          upcomingCountByCircuit={upcomingCountByCircuit}
          selectedCircuitId={selectedCircuitId}
          flyToCircuitId={flyToCircuitId}
          onSelectCircuit={setSelectedCircuitId}
        >
          {selectedCircuit && (
            <CircuitPopup
              circuit={selectedCircuit}
              upcoming={racesByCircuit.get(selectedCircuit.id) ?? []}
              locale={locale}
              onClose={() => setSelectedCircuitId(null)}
            />
          )}
        </MapView>
      </div>
    </div>
  );
}
