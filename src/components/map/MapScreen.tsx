"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Locate, SearchX } from "lucide-react";
import { useKarthopperData } from "@/hooks/use-karthopper-data";
import { getReferenceDate } from "@/lib/reference-date";
import { applyFilters, circuitById, racesByCircuitId, upcomingRaces } from "@/lib/races";
import { useFiltersStore } from "@/store/filters";
import { MapView } from "@/components/map/MapView";
import { CircuitPopup } from "@/components/map/CircuitPopup";
import { RaceFilters } from "@/components/races/RaceFilters";
import { RaceList } from "@/components/races/RaceList";
import { EmptyState } from "@/components/EmptyState";
import { BottomSheet, type SheetState } from "@/components/map/BottomSheet";

const ORIGIN_ZOOM = 7;
const CIRCUIT_ZOOM = 10;

interface FlyTo {
  lat: number;
  lng: number;
  zoom: number;
}

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
  const resetFilters = useFiltersStore((state) => state.resetFilters);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("peek");

  if (loading) {
    return (
      <div className="h-full w-full animate-pulse bg-slate-100 motion-reduce:animate-none" />
    );
  }

  if (error || !circuits || !races) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <EmptyState
          icon={AlertTriangle}
          title={t("common.error")}
          description={t("emptyStates.loadErrorHint")}
          action={{ label: t("common.retry"), onClick: retry }}
        />
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
    const circuit = circuitsById.get(circuitId);
    if (circuit) setFlyTo({ lat: circuit.lat, lng: circuit.lng, zoom: CIRCUIT_ZOOM });
  }

  function handleRecenter() {
    if (origin) setFlyTo({ lat: origin.lat, lng: origin.lng, zoom: ORIGIN_ZOOM });
  }

  const listContent =
    filtered.length === 0 ? (
      <EmptyState
        icon={SearchX}
        title={t("filters.noResults")}
        description={t("filters.noResultsHint")}
        action={{ label: t("filters.reset"), onClick: resetFilters }}
      />
    ) : (
      <>
        {origin === null && (
          <p className="mb-3 text-sm text-slate-500">{t("emptyStates.noOriginHint")}</p>
        )}
        <RaceList
          races={filtered}
          circuits={circuitsById}
          origin={origin}
          locale={locale}
          selectedCircuitId={selectedCircuitId}
          onSelectCircuit={handleSelectFromList}
        />
      </>
    );

  return (
    <div className="flex h-full w-full">
      <aside className="hidden w-[380px] shrink-0 flex-col lg:flex">
        <div className="border-b border-slate-200 bg-slate-50 p-4">
          <RaceFilters resultCount={filtered.length} />
        </div>
        <div className="flex-1 overflow-y-auto p-4">{listContent}</div>
      </aside>

      <div className="relative flex-1">
        <MapView
          circuits={circuits}
          upcomingCountByCircuit={upcomingCountByCircuit}
          selectedCircuitId={selectedCircuitId}
          flyTo={flyTo}
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

        {origin && (
          <button
            type="button"
            onClick={handleRecenter}
            aria-label={t("map.recenter")}
            className="absolute bottom-28 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-card hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 lg:bottom-4"
          >
            <Locate className="h-5 w-5" />
          </button>
        )}
      </div>

      <BottomSheet
        state={sheetState}
        onStateChange={setSheetState}
        peekContent={
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium tabular-nums text-slate-700">
              {t("filters.results", { count: filtered.length })}
            </p>
            {origin && <p className="text-sm text-slate-500">{origin.label}</p>}
          </div>
        }
      >
        <RaceFilters resultCount={filtered.length} />
        <div className="mt-3">{listContent}</div>
      </BottomSheet>
    </div>
  );
}
