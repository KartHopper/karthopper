import type { Race, RaceCategory } from "@/types/race";
import type { Circuit } from "@/types/circuit";
import { haversineKm, type LatLng } from "@/lib/geo";

export interface RaceFilters {
  origin: (LatLng & { label: string }) | null;
  radiusKm: number; // 2000 = illimité
  dateFrom: string; // ISO YYYY-MM-DD inclus
  dateTo: string | null; // ISO inclus, null = sans borne
  categories: RaceCategory[]; // [] = toutes
}

export function upcomingRaces(races: Race[], referenceDate: string): Race[] {
  return races
    .filter((race) => race.date >= referenceDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function racesByCircuitId(races: Race[]): Map<number, Race[]> {
  const map = new Map<number, Race[]>();
  for (const race of races) {
    const existing = map.get(race.circuit_id);
    if (existing) {
      existing.push(race);
    } else {
      map.set(race.circuit_id, [race]);
    }
  }
  return map;
}

export function circuitById(circuits: Circuit[]): Map<number, Circuit> {
  return new Map(circuits.map((circuit) => [circuit.id, circuit]));
}

const CATEGORY_PRIORITY: RaceCategory[] = ["sprint", "endurance", "junior", "other"];

/** Catégorie majoritaire des courses à venir d'un circuit ; égalité → ordre CATEGORY_PRIORITY. */
export function dominantCategoryByCircuit(
  racesByCircuit: Map<number, Race[]>
): Map<number, RaceCategory> {
  const result = new Map<number, RaceCategory>();

  for (const [circuitId, races] of racesByCircuit) {
    const counts = new Map<RaceCategory, number>();
    for (const race of races) {
      counts.set(race.category, (counts.get(race.category) ?? 0) + 1);
    }

    let bestCategory: RaceCategory | null = null;
    let bestCount = 0;
    for (const category of CATEGORY_PRIORITY) {
      const count = counts.get(category) ?? 0;
      if (count > bestCount) {
        bestCount = count;
        bestCategory = category;
      }
    }

    if (bestCategory) {
      result.set(circuitId, bestCategory);
    }
  }

  return result;
}

export function distanceToCircuit(
  origin: LatLng | null,
  circuit: Circuit | undefined
): number | null {
  if (!origin || !circuit) return null;
  return haversineKm(origin, { lat: circuit.lat, lng: circuit.lng });
}

export function applyFilters(
  races: Race[],
  circuits: Map<number, Circuit>,
  filters: RaceFilters
): Race[] {
  const { origin, radiusKm, dateFrom, dateTo, categories } = filters;
  const distanceFilterActive = origin !== null && radiusKm < 2000;

  return races.filter((race) => {
    if (race.date < dateFrom) return false;
    if (dateTo !== null && race.date > dateTo) return false;

    if (categories.length > 0 && !categories.includes(race.category)) {
      return false;
    }

    if (distanceFilterActive) {
      const circuit = circuits.get(race.circuit_id);
      const distance = distanceToCircuit(origin, circuit);
      if (distance === null || distance > radiusKm) return false;
    }

    return true;
  });
}
