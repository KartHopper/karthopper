"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LocateFixed, X } from "lucide-react";
import { useFiltersStore } from "@/store/filters";

interface PhotonSuggestion {
  label: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: { name?: string; country?: string };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function toSuggestions(data: PhotonResponse): PhotonSuggestion[] {
  return data.features
    .filter((feature) => feature.properties.name)
    .map((feature) => ({
      label: [feature.properties.name, feature.properties.country]
        .filter(Boolean)
        .join(", "),
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    }));
}

export function OriginPicker() {
  const t = useTranslations();
  const locale = useLocale();
  const origin = useFiltersStore((state) => state.origin);
  const setOrigin = useFiltersStore((state) => state.setOrigin);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [geoError, setGeoError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleSuggestions = query.trim().length < 3 ? [] : suggestions;

  useEffect(() => {
    if (query.trim().length < 3) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const lang = locale === "fr" ? "fr" : "en";
      fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=${lang}`
      )
        .then((res) => (res.ok ? (res.json() as Promise<PhotonResponse>) : null))
        .then((data) => {
          if (data) setSuggestions(toSuggestions(data));
        })
        .catch(() => setSuggestions([]));
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  function handleUseMyPosition() {
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          label: t("filters.myPosition"),
        });
        setQuery("");
        setSuggestions([]);
      },
      () => {
        setGeoError(t("filters.geoError"));
      }
    );
  }

  function selectSuggestion(suggestion: PhotonSuggestion) {
    setOrigin({ lat: suggestion.lat, lng: suggestion.lng, label: suggestion.label });
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (visibleSuggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, visibleSuggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(visibleSuggestions[activeIndex]);
    }
  }

  if (origin) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-700">{origin.label}</span>
        <button
          type="button"
          onClick={() => setOrigin(null)}
          aria-label={t("common.close")}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUseMyPosition}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          <LocateFixed className="h-4 w-4" aria-hidden="true" />
          {t("filters.myPosition")}
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("filters.cityPlaceholder")}
          role="combobox"
          aria-expanded={visibleSuggestions.length > 0}
          aria-controls="origin-suggestions"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        />

        {visibleSuggestions.length > 0 && (
          <ul
            id="origin-suggestions"
            role="listbox"
            className="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-panel"
          >
            {visibleSuggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onClick={() => selectSuggestion(suggestion)}
                className={`cursor-pointer px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-slate-50 ${
                  index === activeIndex ? "bg-kart-50 text-kart-700" : "text-slate-700"
                }`}
              >
                {suggestion.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {geoError && <p className="text-sm text-slate-500">{geoError}</p>}
    </div>
  );
}
