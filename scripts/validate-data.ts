/**
 * Validate generated KartHopper data files.
 * Run: npx tsx scripts/validate-data.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Circuit } from "../src/types/circuit";
import type { Race } from "../src/types/race";

const DATA_DIR = resolve(process.cwd(), "public/data");

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

function readArgValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function readJsonFile<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }

  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function countDuplicates(values: string[]): number {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  return duplicates.size;
}

function percentage(part: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function validate(circuits: Circuit[], races: Race[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  const circuitIds = new Set(circuits.map((circuit) => circuit.id));
  const futureRaces = races.filter((race) => race.date >= today);
  const unmatchedRaces = races.filter((race) => !circuitIds.has(race.circuit_id));
  const racesWithoutIsoDate = races.filter(
    (race) => !/^\d{4}-\d{2}-\d{2}$/.test(race.date)
  );
  const racesWithPrice = races.filter((race) => race.price !== null);
  const racesWithSpots = races.filter((race) => race.spots_total !== null);
  const circuitDuplicateCount = countDuplicates(
    circuits.map((circuit) => String(circuit.id))
  );
  const raceDuplicateCount = countDuplicates(races.map((race) => race.id));

  if (circuits.length === 0) errors.push("No circuits found");
  if (races.length === 0) errors.push("No races found");
  if (futureRaces.length === 0) errors.push("No future races found");
  if (circuitDuplicateCount > 0) {
    errors.push(`${circuitDuplicateCount} duplicate circuit ids`);
  }
  if (raceDuplicateCount > 0) errors.push(`${raceDuplicateCount} duplicate race ids`);
  if (unmatchedRaces.length > 0) {
    errors.push(`${unmatchedRaces.length} races reference an unknown circuit`);
  }
  if (racesWithoutIsoDate.length > 0) {
    errors.push(`${racesWithoutIsoDate.length} races have a non-ISO date`);
  }
  if (racesWithPrice.length / Math.max(races.length, 1) < 0.8) {
    warnings.push(`Only ${percentage(racesWithPrice.length, races.length)} races have a price`);
  }
  if (racesWithSpots.length / Math.max(races.length, 1) < 0.5) {
    warnings.push(`Only ${percentage(racesWithSpots.length, races.length)} races have spots`);
  }

  return { errors, warnings };
}

function main(): void {
  const racesFileName =
    readArgValue("races") ?? process.env.KH_RACES_FILE ?? "races.json";
  const circuitsPath = resolve(DATA_DIR, "circuits.json");
  const racesPath = resolve(DATA_DIR, racesFileName);
  const circuits = readJsonFile<Circuit[]>(circuitsPath);
  const races = readJsonFile<Race[]>(racesPath);
  const today = new Date().toISOString().slice(0, 10);
  const futureRaces = races.filter((race) => race.date >= today);
  const racesWithPrice = races.filter((race) => race.price !== null);
  const racesWithSpots = races.filter((race) => race.spots_total !== null);
  const enrichedRaces = races.filter((race) => race.enrichment);
  const racesWithAiDuration = enrichedRaces.filter(
    (race) => race.enrichment?.driving_duration_minutes != null
  );
  const racesWithAiEventDuration = enrichedRaces.filter(
    (race) => race.enrichment?.event_driving_duration_minutes != null
  );
  const racesWithInferredSpots = enrichedRaces.filter(
    (race) => race.enrichment?.spots_total_inferred != null
  );
  const racesNeedingReview = enrichedRaces.filter(
    (race) => race.enrichment?.needs_review === true
  );
  const dates = races.map((race) => race.date).sort();
  const categories = races.reduce<Record<string, number>>((counts, race) => {
    counts[race.category] = (counts[race.category] ?? 0) + 1;
    return counts;
  }, {});
  const result = validate(circuits, races);

  console.log("KartHopper data validation");
  console.log(`  Races file: ${racesFileName}`);
  console.log(`  Circuits: ${circuits.length}`);
  console.log(`  Races: ${races.length}`);
  console.log(`  Future races since ${today}: ${futureRaces.length}`);
  console.log(`  Date range: ${dates[0] ?? "n/a"} -> ${dates.at(-1) ?? "n/a"}`);
  console.log(`  With price: ${racesWithPrice.length}/${races.length}`);
  console.log(`  With spots: ${racesWithSpots.length}/${races.length}`);
  console.log(`  Categories: ${JSON.stringify(categories)}`);
  if (enrichedRaces.length > 0) {
    console.log(`  AI enriched: ${enrichedRaces.length}/${races.length}`);
    console.log(`  AI duration: ${racesWithAiDuration.length}/${races.length}`);
    console.log(
      `  AI event duration: ${racesWithAiEventDuration.length}/${races.length}`
    );
    console.log(`  AI inferred spots: ${racesWithInferredSpots.length}/${races.length}`);
    console.log(`  AI needs review: ${racesNeedingReview.length}/${races.length}`);
  }

  for (const warning of result.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`Error: ${error}`);
    }
    process.exit(1);
  }
}

main();
