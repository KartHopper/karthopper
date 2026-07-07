import { getReferenceDate } from "@/lib/reference-date";
import type { Race } from "@/types/race";
import type { Circuit } from "@/types/circuit";

const MAX_DESCRIPTION_LENGTH = 150;

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

function formatPrice(race: Race): string {
  return race.price === null ? "" : `${race.price} ${race.currency}`;
}

function buildDescription(race: Race): string {
  const parts = [race.category, formatPrice(race), race.sws_url].filter(Boolean);
  const text = parts.join(" — ");
  return text.length > MAX_DESCRIPTION_LENGTH
    ? `${text.slice(0, MAX_DESCRIPTION_LENGTH - 1)}…`
    : text;
}

/** Génère un VCALENDAR (RFC 5545) pour une course — événement journée entière. */
export function buildRaceIcs(race: Race, circuit: Circuit | undefined): string {
  const dtStamp = `${getReferenceDate().replace(/-/g, "")}T000000Z`;
  const dtStart = race.date.replace(/-/g, "");
  const summary = circuit ? `${race.title} (${circuit.name})` : race.title;
  const location = circuit ? `${circuit.name}, ${circuit.city}, ${circuit.country}` : "";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KartHopper//karthopper.com//EN",
    "BEGIN:VEVENT",
    `UID:race-${race.id}@karthopper.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `SUMMARY:${escapeIcsText(summary)}`,
  ];

  if (location) lines.push(`LOCATION:${escapeIcsText(location)}`);
  if (circuit) lines.push(`GEO:${circuit.lat};${circuit.lng}`);

  lines.push(`DESCRIPTION:${escapeIcsText(buildDescription(race))}`);
  lines.push(`URL:${race.sws_url}`);
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return `${lines.join("\r\n")}\r\n`;
}
