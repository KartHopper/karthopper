import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Circuit } from "@/types/circuit";
import type { Race } from "@/types/race";

const DATA_DIR = resolve(process.cwd(), "public/data");

export function loadCircuits(): Circuit[] {
  const path = resolve(DATA_DIR, "circuits.json");
  return JSON.parse(readFileSync(path, "utf-8")) as Circuit[];
}

export function loadRaces(): Race[] {
  const path = resolve(DATA_DIR, "races.json");
  return JSON.parse(readFileSync(path, "utf-8")) as Race[];
}

export function findCircuitBySlug(slug: string): Circuit | undefined {
  return loadCircuits().find((circuit) => circuit.slug === slug);
}
