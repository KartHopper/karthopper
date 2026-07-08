"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, Locate, SearchX } from "lucide-react";
import { useKarthopperData } from "@/hooks/use-karthopper-data";
import { getReferenceDate } from "@/lib/reference-date";
import {
  circuitById,
  dominantCategoryByCircuit,
  eventsByCircuitId,
  filterEvents,
  groupRacesIntoEvents,
  upcomingRaces,
} from "@/lib/races";
import { useFiltersStore } from "@/store/filters";
import { MapView } from "@/components/map/MapView";
import { CircuitPopup } from "@/components/map/CircuitPopup";
import { RaceFilters } from "@/components/races/RaceFilters";
import { RaceList } from "@/components/races/RaceList";
import { EmptyState } from "@/components/EmptyState";
import { BottomSheet, type SheetState } from "@/components/map/BottomSheet";
import { UrlFiltersSync } from "@/components/map/UrlFiltersSync";
import { PassportSummary } from "@/components/passport/PassportSummary";
import { PassportTransfer } from "@/components/passport/PassportTransfer";
import { usePassportStore } from "@/store/passport";

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
  const visits = usePassportStore((state) => state.visits);
  const [flyTo, setFlyTo] = useState<FlyTo | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("peek");
  const [passportMode, setPassportMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Nécessaire pour éviter un mismatch d'hydratation (cf. VisitToggle).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (loading) {
    return (
      <>
        <UrlFiltersSync />
        <div className="h-full w-full animate-pulse bg-slate-100 motion-reduce:animate-none" />
      </>
    );
  }

  if (error || !circuits || !races) {
    return (
      <>
        <UrlFiltersSync />
        <div className="flex h-full w-full items-center justify-center">
          <EmptyState
            icon={AlertTriangle}
            title={t("common.error")}
            description={t("emptyStates.loadErrorHint")}
            action={{ label: t("common.retry"), onClick: retry }}
          />
        </div>
      </>
    );
  }

  const referenceDate = getReferenceDate();
  const upcoming = upcomingRaces(races, referenceDate);
  const circuitsById = circuitById(circuits);
  // Une "course" = un événement regroupant toutes ses manches (cf. groupRacesIntoEvents).
  const allEvents = groupRacesIntoEvents(upcoming);
  const filteredEvents = filterEvents(allEvents, circuitsById, {
    origin,
    radiusKm,
    dateFrom: dateFrom ?? referenceDate,
    dateTo,
    categories,
  });
  // La carte reflète les filtres actifs (compteurs + couleurs = événements filtrés).
  const eventsByCircuit = eventsByCircuitId(filteredEvents);
  const upcomingCountByCircuit = new Map(
    Array.from(eventsByCircuit.entries()).map(([id, list]) => [id, list.length])
  );
  const dominantCategories = dominantCategoryByCircuit(eventsByCircuit);
  // En mode normal, seuls les circuits ayant ≥1 événement filtré sont affichés
  // (le clustering se resserre quand on filtre — fix « le filtre ne change rien à la carte »).
  // En mode passeport, tous les circuits restent visibles (on coche même sans course à venir).
  const visibleCircuits = passportMode
    ? circuits
    : circuits.filter((circuit) => eventsByCircuit.has(circuit.id));
  const selectedCircuit =
    selectedCircuitId !== null ? circuitsById.get(selectedCircuitId) : undefined;
  const visitedIds = new Set(mounted ? Object.keys(visits).map(Number) : []);

  const shortDateFormatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const activeFilterSegments: string[] = [];
  if (origin) activeFilterSegments.push(origin.label);
  if (radiusKm < 2000) activeFilterSegments.push(`< ${radiusKm} km`);
  if (dateFrom !== null || dateTo !== null) {
    const from = shortDateFormatter.format(new Date(dateFrom ?? referenceDate));
    activeFilterSegments.push(dateTo ? `${from} → ${shortDateFormatter.format(new Date(dateTo))}` : `${from} →`);
  }
  if (categories.length > 0) {
    activeFilterSegments.push(categories.map((category) => t(`categories.${category}`)).join(", "));
  }
  const activeFiltersSummary =
    activeFilterSegments.length > 0 ? activeFilterSegments.join(" · ") : t("filters.noActiveFilters");

  function handleSelectFromList(circuitId: number) {
    setSelectedCircuitId(circuitId);
    const circuit = circuitsById.get(circuitId);
    if (circuit) setFlyTo({ lat: circuit.lat, lng: circuit.lng, zoom: CIRCUIT_ZOOM });
  }

  function handleRecenter() {
    if (origin) setFlyTo({ lat: origin.lat, lng: origin.lng, zoom: ORIGIN_ZOOM });
  }

  const listContent =
    filteredEvents.length === 0 ? (
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
          events={filteredEvents}
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
      <UrlFiltersSync />

      {/* Colonne gauche (desktop) : passeport + filtres */}
      <aside className="hidden w-[300px] shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:flex">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2">
            <PassportSummary circuits={circuitsById} />
            <button
              type="button"
              role="switch"
              aria-checked={passportMode}
              onClick={() => setPassportMode((value) => !value)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
                passportMode
                  ? "border-kart-500 bg-kart-50 text-kart-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("passport.mapMode")}
            </button>
          </div>
          <PassportTransfer />
        </div>
        <div className="p-4">
          <RaceFilters resultCount={filteredEvents.length} />
        </div>
      </aside>

      <div className="relative flex-1">
        <MapView
          circuits={visibleCircuits}
          upcomingCountByCircuit={upcomingCountByCircuit}
          dominantCategoryByCircuit={dominantCategories}
          visitedIds={visitedIds}
          passportMode={passportMode}
          selectedCircuitId={selectedCircuitId}
          flyTo={flyTo}
          onSelectCircuit={setSelectedCircuitId}
        >
          {selectedCircuit && (
            <CircuitPopup
              circuit={selectedCircuit}
              events={eventsByCircuit.get(selectedCircuit.id) ?? []}
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
            <Locate className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Colonne droite (desktop) : liste des courses */}
      <aside className="hidden w-[380px] shrink-0 flex-col overflow-y-auto border-l border-slate-200 lg:flex">
        <div className="p-4">{listContent}</div>
      </aside>

      <BottomSheet
        state={sheetState}
        onStateChange={setSheetState}
        peekContent={
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <PassportSummary circuits={circuitsById} />
              <button
                type="button"
                role="switch"
                aria-checked={passportMode}
                onClick={() => setPassportMode((value) => !value)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${
                  passportMode
                    ? "border-kart-500 bg-kart-50 text-kart-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("passport.mapMode")}
              </button>
            </div>
            <PassportTransfer />
            <p className="text-sm font-medium tabular-nums text-slate-700">
              {t("filters.results", { count: filteredEvents.length })}
            </p>
            <p className="text-xs text-slate-500">{activeFiltersSummary}</p>
            <button
              type="button"
              onClick={() => setSheetState("half")}
              className="mt-2 rounded-lg bg-kart-500 py-2 text-sm font-medium text-white transition-colors motion-reduce:transition-none hover:bg-kart-400 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
            >
              {t("map.viewList", { count: filteredEvents.length })}
            </button>
          </div>
        }
      >
        <RaceFilters resultCount={filteredEvents.length} />
        <div className="mt-3">{listContent}</div>
      </BottomSheet>
    </div>
  );
}
