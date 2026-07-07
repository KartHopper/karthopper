/**
 * Fetch SWS circuits from the marker endpoint.
 * Outputs: public/data/circuits.json
 * Run: npx tsx scripts/fetch-circuits.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CURRENCY_BY_COUNTRY,
  SWS_ENDPOINTS,
  SWS_FETCH_TIMEOUT_MS,
  SWS_HEADERS,
} from "../src/lib/config";
import type { Circuit } from "../src/types/circuit";

const DATA_DIR = resolve(process.cwd(), "public/data");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringFrom(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugFromTrackLink(link: string, name: string, id: number): string {
  const match = link.match(/\/tracks\/([^/]+)\.html$/);
  if (match) return match[1];
  return `${slugify(name)}-${id}`;
}

function getMarkers(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (isRecord(payload) && Array.isArray(payload.data)) return payload.data;
  throw new Error("Unexpected SWS circuits response shape");
}

function normalizeCircuit(raw: unknown): Circuit | null {
  if (!isRecord(raw)) return null;

  const id = numberFrom(raw.id);
  const lat = numberFrom(raw.latitude);
  const lng = numberFrom(raw.longitude);
  const name = stringFrom(raw.name);
  const swsUrl = stringFrom(raw.link);

  if (id === null || lat === null || lng === null || !name) return null;

  const countryIso = stringFrom(raw.country_iso).toLowerCase();
  const address = [stringFrom(raw.address_1), stringFrom(raw.address_2)]
    .filter(Boolean)
    .join(", ");

  return {
    id,
    name,
    slug: slugFromTrackLink(swsUrl, name, id),
    reference: stringFrom(raw.reference),
    lat,
    lng,
    country: stringFrom(raw.country),
    country_iso: countryIso,
    city: stringFrom(raw.town),
    address,
    phone: stringFrom(raw.phone),
    website: stringFrom(raw.website),
    photo_url: stringFrom(raw.photo),
    photo_thumb_url: stringFrom(raw.photo_table),
    sws_url: swsUrl,
    currency: CURRENCY_BY_COUNTRY[countryIso] ?? "EUR",
  };
}

async function fetchCircuits(): Promise<Circuit[]> {
  const response = await fetch(SWS_ENDPOINTS.circuits, {
    headers: SWS_HEADERS,
    signal: AbortSignal.timeout(SWS_FETCH_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${SWS_ENDPOINTS.circuits}`);
  }

  const payload: unknown = await response.json();
  const circuits = getMarkers(payload)
    .map(normalizeCircuit)
    .filter((circuit): circuit is Circuit => circuit !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));

  if (circuits.length === 0) {
    throw new Error("No circuits found in SWS response");
  }

  return circuits;
}

async function main(): Promise<void> {
  const circuits = await fetchCircuits();
  mkdirSync(DATA_DIR, { recursive: true });

  const outputPath = resolve(DATA_DIR, "circuits.json");
  writeFileSync(outputPath, `${JSON.stringify(circuits, null, 2)}\n`, "utf-8");

  const countries = new Set(circuits.map((circuit) => circuit.country_iso));
  console.log(`Fetched ${circuits.length} circuits in ${countries.size} countries`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error("Fatal:", error);
  process.exit(1);
});
