import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LatLng } from "@/lib/geo";
import type { RaceCategory } from "@/types/race";

export interface Origin extends LatLng {
  label: string;
}

interface FiltersStore {
  origin: Origin | null;
  radiusKm: number; // défaut 2000 (= illimité)
  dateFrom: string | null; // null = date de référence (défaut)
  dateTo: string | null;
  categories: RaceCategory[]; // défaut [] = toutes
  selectedCircuitId: number | null; // circuit sélectionné (popup / focus liste)
  setOrigin(origin: Origin | null): void;
  setRadiusKm(km: number): void;
  setDateRange(from: string | null, to: string | null): void;
  toggleCategory(category: RaceCategory): void;
  setSelectedCircuitId(id: number | null): void;
  resetFilters(): void; // remet radius/dates/categories, conserve origin
  hydrateFromUrl(
    partial: Partial<
      Pick<FiltersStore, "origin" | "radiusKm" | "dateFrom" | "dateTo" | "categories">
    >
  ): void;
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set) => ({
      origin: null,
      radiusKm: 2000,
      dateFrom: null,
      dateTo: null,
      categories: [],
      selectedCircuitId: null,
      setOrigin: (origin) => set({ origin }),
      setRadiusKm: (radiusKm) => set({ radiusKm }),
      setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
      toggleCategory: (category) =>
        set((state) => ({
          categories: state.categories.includes(category)
            ? state.categories.filter((c) => c !== category)
            : [...state.categories, category],
        })),
      setSelectedCircuitId: (selectedCircuitId) => set({ selectedCircuitId }),
      resetFilters: () =>
        set({ radiusKm: 2000, dateFrom: null, dateTo: null, categories: [] }),
      hydrateFromUrl: (partial) => set(partial),
    }),
    { name: "karthopper.filters.v1", partialize: (state) => ({ origin: state.origin }) }
  )
);
