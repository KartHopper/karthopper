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

/**
 * Un événement de karting = toutes les manches d'une même course, qu'un pilote
 * s'inscrit ensemble. Regroupe les courses par circuit + date + catégorie + prix
 * + modèle de kart (cf. décision produit 2026-07-08 : ne fusionner que les
 * manches vraiment identiques).
 */
export interface RaceEvent {
  key: string;
  circuit_id: number;
  date: string;
  category: RaceCategory;
  /** Course représentative (la première de la liste triée) pour l'affichage. */
  representative: Race;
  races: Race[];
  mancheCount: number;
}

export function upcomingRaces(races: Race[], referenceDate: string): Race[] {
  return races
    .filter((race) => race.date >= referenceDate)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function eventKey(race: Race): string {
  return [
    race.circuit_id,
    race.date,
    race.category,
    race.price ?? "np",
    race.kart_model ?? "nk",
  ].join("|");
}

/** Regroupe des courses (déjà triées) en événements. Conserve l'ordre d'apparition. */
export function groupRacesIntoEvents(races: Race[]): RaceEvent[] {
  const map = new Map<string, RaceEvent>();

  for (const race of races) {
    const key = eventKey(race);
    const existing = map.get(key);
    if (existing) {
      existing.races.push(race);
      existing.mancheCount += 1;
    } else {
      map.set(key, {
        key,
        circuit_id: race.circuit_id,
        date: race.date,
        category: race.category,
        representative: race,
        races: [race],
        mancheCount: 1,
      });
    }
  }

  return Array.from(map.values());
}

export function eventsByCircuitId(events: RaceEvent[]): Map<number, RaceEvent[]> {
  const map = new Map<number, RaceEvent[]>();
  for (const event of events) {
    const existing = map.get(event.circuit_id);
    if (existing) {
      existing.push(event);
    } else {
      map.set(event.circuit_id, [event]);
    }
  }
  return map;
}

export function circuitById(circuits: Circuit[]): Map<number, Circuit> {
  return new Map(circuits.map((circuit) => [circuit.id, circuit]));
}

const CATEGORY_PRIORITY: RaceCategory[] = ["sprint", "endurance", "junior", "other"];

/** Catégorie majoritaire des événements à venir d'un circuit ; égalité → ordre CATEGORY_PRIORITY. */
export function dominantCategoryByCircuit(
  eventsByCircuit: Map<number, RaceEvent[]>
): Map<number, RaceCategory> {
  const result = new Map<number, RaceCategory>();

  for (const [circuitId, events] of eventsByCircuit) {
    const counts = new Map<RaceCategory, number>();
    for (const event of events) {
      counts.set(event.category, (counts.get(event.category) ?? 0) + 1);
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

export function filterEvents(
  events: RaceEvent[],
  circuits: Map<number, Circuit>,
  filters: RaceFilters
): RaceEvent[] {
  const { origin, radiusKm, dateFrom, dateTo, categories } = filters;
  const distanceFilterActive = origin !== null && radiusKm < 2000;

  return events.filter((event) => {
    if (event.date < dateFrom) return false;
    if (dateTo !== null && event.date > dateTo) return false;

    if (categories.length > 0 && !categories.includes(event.category)) {
      return false;
    }

    if (distanceFilterActive) {
      const circuit = circuits.get(event.circuit_id);
      const distance = distanceToCircuit(origin, circuit);
      if (distance === null || distance > radiusKm) return false;
    }

    return true;
  });
}
