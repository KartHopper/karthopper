"use client";

import { useLocale, useTranslations } from "next-intl";
import { useKarthopperData } from "@/hooks/use-karthopper-data";
import { getReferenceDate } from "@/lib/reference-date";
import { circuitById, racesByCircuitId, upcomingRaces } from "@/lib/races";
import { useFiltersStore } from "@/store/filters";
import { MapView } from "@/components/map/MapView";
import { CircuitPopup } from "@/components/map/CircuitPopup";
import { OriginPicker } from "@/components/map/OriginPicker";

export function MapScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const { circuits, races, loading, error, retry } = useKarthopperData();
  const selectedCircuitId = useFiltersStore((state) => state.selectedCircuitId);
  const setSelectedCircuitId = useFiltersStore((state) => state.setSelectedCircuitId);

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

  const upcoming = upcomingRaces(races, getReferenceDate());
  const circuitsById = circuitById(circuits);
  const racesByCircuit = racesByCircuitId(upcoming);
  const upcomingCountByCircuit = new Map(
    Array.from(racesByCircuit.entries()).map(([id, list]) => [id, list.length])
  );
  const selectedCircuit =
    selectedCircuitId !== null ? circuitsById.get(selectedCircuitId) : undefined;

  return (
    <div className="flex h-full w-full">
      <aside className="hidden w-[380px] shrink-0 flex-col gap-4 border-r border-slate-200 bg-slate-50 p-4 lg:flex">
        <OriginPicker />
        <p className="text-sm font-medium tabular-nums text-slate-700">
          {t("filters.results", { count: upcoming.length })}
        </p>
      </aside>

      <div className="relative flex-1">
        <MapView
          circuits={circuits}
          upcomingCountByCircuit={upcomingCountByCircuit}
          selectedCircuitId={selectedCircuitId}
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
