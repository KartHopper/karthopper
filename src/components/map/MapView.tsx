"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import {
  Map,
  Marker,
  Source,
  Layer,
  type MapRef,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { Circuit } from "@/types/circuit";
import { useFiltersStore } from "@/store/filters";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewProps {
  circuits: Circuit[];
  upcomingCountByCircuit: Map<number, number>;
  visitedIds?: ReadonlySet<number>;
  passportMode?: boolean;
  onSelectCircuit(id: number | null): void;
  selectedCircuitId: number | null;
  /** Position à recentrer/zoomer (sélection depuis la liste ou bouton recentrer — pas un clic sur la carte). */
  flyTo?: { lat: number; lng: number; zoom: number } | null;
  children?: React.ReactNode;
}

const DEFAULT_CENTER = { lng: 4.85, lat: 46.6 };
const DEFAULT_ZOOM = 5;
const ORIGIN_ZOOM = 7;

interface CircuitFeatureProperties {
  id: number;
  name: string;
  upcoming: number;
  visited: boolean;
}

function buildCircuitsGeoJson(
  circuits: Circuit[],
  upcomingCountByCircuit: Map<number, number>,
  visitedIds: ReadonlySet<number> | undefined
): GeoJSON.FeatureCollection<GeoJSON.Point, CircuitFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: circuits.map((circuit) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [circuit.lng, circuit.lat] },
      properties: {
        id: circuit.id,
        name: circuit.name,
        upcoming: upcomingCountByCircuit.get(circuit.id) ?? 0,
        visited: visitedIds?.has(circuit.id) ?? false,
      },
    })),
  };
}

export function MapView({
  circuits,
  upcomingCountByCircuit,
  visitedIds,
  passportMode = false,
  onSelectCircuit,
  selectedCircuitId,
  flyTo = null,
  children,
}: MapViewProps) {
  const t = useTranslations();
  const mapRef = useRef<MapRef>(null);
  const origin = useFiltersStore((state) => state.origin);
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;

  useEffect(() => {
    if (!flyTo) return;
    const map = mapRef.current?.getMap();
    if (map) {
      map.easeTo({ center: [flyTo.lng, flyTo.lat], zoom: flyTo.zoom });
    }
  }, [flyTo]);

  const initialViewState = useMemo(
    () =>
      origin
        ? { longitude: origin.lng, latitude: origin.lat, zoom: ORIGIN_ZOOM }
        : { longitude: DEFAULT_CENTER.lng, latitude: DEFAULT_CENTER.lat, zoom: DEFAULT_ZOOM },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- valeur lue une seule fois au montage
    []
  );

  const geojson = useMemo(
    () => buildCircuitsGeoJson(circuits, upcomingCountByCircuit, visitedIds),
    [circuits, upcomingCountByCircuit, visitedIds]
  );

  if (!apiKey) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-slate-400" aria-hidden="true" />
        <p className="max-w-xs text-sm text-slate-500">{t("map.missingKey")}</p>
      </div>
    );
  }

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];

    if (!feature) {
      onSelectCircuit(null);
      return;
    }

    if (feature.layer.id === "clusters") {
      const map = mapRef.current?.getMap();
      if (map) {
        map.easeTo({ center: event.lngLat, zoom: map.getZoom() + 2 });
      }
      return;
    }

    if (feature.layer.id === "circuit-point") {
      const properties = feature.properties as CircuitFeatureProperties;
      onSelectCircuit(properties.id);
    }
  }

  const selectedFilterId = selectedCircuitId ?? -1;

  return (
    <Map
      ref={mapRef}
      initialViewState={initialViewState}
      mapStyle={`https://api.maptiler.com/maps/positron/style.json?key=${apiKey}`}
      interactiveLayerIds={["clusters", "circuit-point"]}
      cursor="pointer"
      onClick={handleClick}
      style={{ width: "100%", height: "100%" }}
    >
      <Source
        id="circuits"
        type="geojson"
        data={geojson}
        cluster
        clusterRadius={50}
        clusterMaxZoom={11}
      >
        <Layer
          id="clusters"
          type="circle"
          filter={["has", "point_count"]}
          paint={{
            "circle-color": "#1E293B",
            "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#FFFFFF",
          }}
        />
        <Layer
          id="cluster-count"
          type="symbol"
          filter={["has", "point_count"]}
          layout={{
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
          }}
          paint={{ "text-color": "#FFFFFF" }}
        />
        <Layer
          id="circuit-point"
          type="circle"
          filter={["!", ["has", "point_count"]]}
          paint={{
            "circle-color": passportMode
              ? ["case", ["get", "visited"], "#FF5A1F", "#CBD5E1"]
              : ["case", [">", ["get", "upcoming"], 0], "#FF5A1F", "#94A3B8"],
            "circle-radius": ["case", ["==", ["get", "id"], selectedFilterId], 14, 12],
            "circle-stroke-width": ["case", ["==", ["get", "id"], selectedFilterId], 4, 2],
            "circle-stroke-color": "#FFFFFF",
          }}
        />
        <Layer
          id="circuit-count"
          type="symbol"
          filter={
            passportMode
              ? ["==", 1, 0]
              : ["all", ["!", ["has", "point_count"]], [">", ["get", "upcoming"], 0]]
          }
          layout={{
            "text-field": ["get", "upcoming"],
            "text-size": 11,
          }}
          paint={{ "text-color": "#FFFFFF" }}
        />
      </Source>

      {origin && (
        <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
          <div className="h-3 w-3 rounded-full border-2 border-white bg-blue-600 shadow-card" />
        </Marker>
      )}

      {children}
    </Map>
  );
}
