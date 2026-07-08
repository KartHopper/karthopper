/**
 * Scrape SWS races: calendar pages + individual race detail pages.
 * Outputs: public/data/races.json and public/data/unmatched.json
 * Run: npx tsx scripts/scrape-races.ts
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import * as cheerio from "cheerio";
import {
  CURRENCY_BY_COUNTRY,
  SWS_BASE_URL,
  SWS_ENDPOINTS,
  SWS_FETCH_TIMEOUT_MS,
  SWS_HEADERS,
  SWS_REQUEST_DELAY_MS,
  getSwsLocale,
  looksLikeSwsCaptcha,
} from "../src/lib/config";
import type { Circuit } from "../src/types/circuit";
import type { Race, RaceCategory } from "../src/types/race";

const DATA_DIR = resolve(process.cwd(), "public/data");
const IS_SMOKE_TEST =
  hasFlag("smoke") || process.env.SWS_SMOKE_TEST === "1";
const IS_TEST_SCRAPE =
  hasFlag("test") || process.env.SWS_TEST_SCRAPE === "1";
const REQUEST_DELAY_MS = readNonNegativeIntEnv(
  "delay-ms",
  "SWS_REQUEST_DELAY_MS",
  IS_SMOKE_TEST ? 0 : IS_TEST_SCRAPE ? 250 : SWS_REQUEST_DELAY_MS
);
const FETCH_TIMEOUT_MS = readPositiveIntEnv(
  "timeout-ms",
  "SWS_FETCH_TIMEOUT_MS",
  IS_SMOKE_TEST ? 5000 : IS_TEST_SCRAPE ? 10000 : SWS_FETCH_TIMEOUT_MS
);

interface CalendarEntry {
  raceUrl: string;
  date: string;
  category: RaceCategory;
  circuitSlug: string;
  title: string;
  countryIso: string;
}

interface CircuitMatcher {
  bySlug: Map<string, Circuit>;
  circuits: Circuit[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function readArgValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function readPositiveIntEnv(
  argName: string,
  envName: string,
  fallback: number
): number {
  const raw = readArgValue(argName) ?? process.env[envName];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readNonNegativeIntEnv(
  argName: string,
  envName: string,
  fallback: number
): number {
  const raw = readArgValue(argName) ?? process.env[envName];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readJsonFile<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

async function fetchHtml(url: string): Promise<string> {
  const absoluteUrl = new URL(url, SWS_BASE_URL).toString();
  const response = await fetch(absoluteUrl, {
    headers: SWS_HEADERS,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${absoluteUrl}`);

  const body = await response.text();
  if (looksLikeSwsCaptcha(body)) {
    throw new Error("SWS_CAPTCHA: scraping bloqué par reCAPTCHA — voir PIPELINE.md");
  }

  return body;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLabel(value: string): string {
  return normalizeWhitespace(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  );
}

function labelMatches(label: string, aliases: string[]): boolean {
  const normalized = normalizeLabel(label);
  return aliases.some((alias) => normalized === normalizeLabel(alias));
}

function parseCategory(cssClass: string): RaceCategory {
  const normalized = cssClass.toLowerCase();
  if (normalized.includes("sprint")) return "sprint";
  if (normalized.includes("endurance")) return "endurance";
  if (normalized.includes("junior")) return "junior";
  return "other";
}

function extractIdFromUrl(url: string): string {
  const match = url.match(/-(\d+)\.html$/);
  return match ? match[1] : url;
}

function extractCircuitSlugFromUrl(url: string): string {
  const match = url.match(/\/races\/([^/]+)\//);
  return match ? match[1] : "";
}

function extractRaceSlugFromUrl(url: string): string {
  const match = url.match(/\/races\/[^/]+\/(.+)$/);
  return match ? match[1] : "";
}

function normalizeIsoDate(value: string): string {
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : normalizeWhitespace(value);
}

function parseLocalizedNumber(value: string): number | null {
  let normalized = value.replace(/\s/g, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma > lastDot) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePrice(
  text: string,
  fallbackCurrency: string
): { price: number | null; currency: string } {
  const numberMatch = text.match(/\d[\d\s.,]*/);
  const currencyMatch = text.match(/\b([A-Z]{3})\b/i);

  return {
    price: numberMatch ? parseLocalizedNumber(numberMatch[0]) : null,
    currency: currencyMatch ? currencyMatch[1].toUpperCase() : fallbackCurrency,
  };
}

function parseSpots(text: string): {
  spots_taken: number | null;
  spots_total: number | null;
} {
  const match = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!match) return { spots_taken: null, spots_total: null };

  return {
    spots_taken: Number.parseInt(match[1], 10),
    spots_total: Number.parseInt(match[2], 10),
  };
}

function parseBallast(text: string): boolean | null {
  const normalized = normalizeLabel(text);
  if (!normalized) return null;
  if (normalized.includes("yes") || normalized.includes("oui")) return true;
  if (normalized.includes("no") || normalized.includes("non")) return false;
  return null;
}

function htmlToText(html: string | null): string {
  if (!html) return "";
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  return normalizeWhitespace(cheerio.load(`<body>${withBreaks}</body>`)("body").text());
}

function getHeroField($: cheerio.CheerioAPI, aliases: string[]): string {
  let result = "";

  $(".race-detail-info-bloc").each((_, element) => {
    if (result) return;

    const block = $(element);
    const heading = block.find("h3").first();
    if (!labelMatches(heading.text(), aliases)) return;

    const clone = block.clone();
    clone.find("h3").first().remove();
    result = normalizeWhitespace(clone.text());
  });

  return result;
}

function getDetailTableField($: cheerio.CheerioAPI, aliases: string[]): string {
  let result = "";

  $("#race-detail-info tr").each((_, element) => {
    if (result) return;

    const row = $(element);
    const label = row.find("th").first().text();
    if (!labelMatches(label, aliases)) return;

    result = normalizeWhitespace(row.find("td").first().text());
  });

  return result;
}

function getPanelBody($: cheerio.CheerioAPI, aliases: string[]): string {
  let result = "";

  $(".panel").each((_, element) => {
    if (result) return;

    const panel = $(element);
    const title = panel.find(".panel-heading .panel-title").first().text();
    if (!labelMatches(title, aliases)) return;

    result = htmlToText(panel.find(".panel-body").first().html());
  });

  return result;
}

function stripTrailingId(slug: string): string {
  return slug.replace(/-\d+$/, "");
}

function createCircuitMatcher(circuits: Circuit[]): CircuitMatcher {
  const bySlug = new Map<string, Circuit>();

  for (const circuit of circuits) {
    bySlug.set(circuit.slug, circuit);
    bySlug.set(stripTrailingId(circuit.slug), circuit);
  }

  return { bySlug, circuits };
}

function findCircuit(matcher: CircuitMatcher, circuitSlug: string): Circuit | null {
  const direct = matcher.bySlug.get(circuitSlug);
  if (direct) return direct;

  const stripped = stripTrailingId(circuitSlug);
  return (
    matcher.bySlug.get(stripped) ??
    matcher.circuits.find((circuit) => circuit.slug.includes(circuitSlug)) ??
    null
  );
}

function parseCalendarPage(
  html: string
): { entries: CalendarEntry[]; totalPages: number } {
  const $ = cheerio.load(html);
  const entries: CalendarEntry[] = [];

  $("tr[data-rowlink]").each((_, element) => {
    const row = $(element);
    const raceUrl = row.attr("data-rowlink") ?? "";
    if (!raceUrl) return;

    const cells = row.find("td");
    const categoryClass = $(cells[0]).find("span").first().attr("class") ?? "";
    const date = normalizeIsoDate($(cells[1]).text());

    const flagClass =
      $(cells[2]).find("span[class*=country-flag-]").first().attr("class") ?? "";
    const countryMatch = flagClass.match(/country-flag-([a-z]{2})/);
    const countryIso = countryMatch ? countryMatch[1] : "";

    const titleLink = row.find("a[title]").first();
    const title = normalizeWhitespace(
      titleLink.attr("title") ?? titleLink.text() ?? ""
    );

    entries.push({
      raceUrl,
      date,
      category: parseCategory(categoryClass),
      circuitSlug: extractCircuitSlugFromUrl(raceUrl),
      title,
      countryIso,
    });
  });

  let totalPages = 1;
  $(".pagination a").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    const pageMatch = href.match(/\/page\/(\d+)/);
    if (!pageMatch) return;

    const page = Number.parseInt(pageMatch[1], 10);
    if (page > totalPages) totalPages = page;
  });

  return { entries, totalPages };
}

async function scrapeCalendarMonth(
  year: number,
  month: number,
  maxPages: number
): Promise<CalendarEntry[]> {
  const baseUrl = SWS_ENDPOINTS.racesCalendar("en-gb", year, month);
  console.log(`  Fetching calendar: ${baseUrl}`);

  const firstHtml = await fetchHtml(baseUrl);
  const { entries: firstEntries, totalPages } = parseCalendarPage(firstHtml);
  const allEntries = [...firstEntries];
  const pagesToFetch = Math.min(totalPages, maxPages);

  console.log(`    Page 1/${totalPages}: ${firstEntries.length} races`);
  if (pagesToFetch < totalPages) {
    console.log(`    Calendar page limit active: ${pagesToFetch}/${totalPages}`);
  }

  for (let page = 2; page <= pagesToFetch; page++) {
    await sleep(REQUEST_DELAY_MS);
    const url = `${baseUrl}/page/${page}`;

    try {
      const html = await fetchHtml(url);
      const { entries } = parseCalendarPage(html);
      allEntries.push(...entries);
      if (page % 10 === 0 || page === totalPages) {
        console.log(`    Page ${page}/${totalPages}: ${allEntries.length} races total`);
      }
    } catch (error: unknown) {
      console.warn(`    Failed page ${page}:`, error);
    }
  }

  console.log(
    `    Found ${allEntries.length} races for ${year}/${String(month).padStart(2, "0")}`
  );
  return allEntries;
}

function raceUrlForLocale(url: string, locale: string): string {
  return url.replace(/\/[a-z]{2}-[a-z]{2}\//, `/${locale}/`);
}

function raceNeedsRefresh(race: Race): boolean {
  return (
    race.circuit_id === 0 ||
    race.price === null ||
    race.spots_total === null ||
    race.kart_model === null ||
    race.timing === null
  );
}

async function scrapeRaceDetail(
  calendarEntry: CalendarEntry,
  matcher: CircuitMatcher
): Promise<Race | null> {
  const matchedCircuit = findCircuit(matcher, calendarEntry.circuitSlug);
  const fallbackCurrency =
    matchedCircuit?.currency ??
    CURRENCY_BY_COUNTRY[calendarEntry.countryIso.toLowerCase()] ??
    "EUR";
  const locale = getSwsLocale(calendarEntry.countryIso);
  const url = raceUrlForLocale(calendarEntry.raceUrl, locale);

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const priceText = getHeroField($, ["price", "prix"]);
    const { price, currency } = parsePrice(priceText, fallbackCurrency);

    const spotsText = getDetailTableField($, ["preregistered", "preinscrits"]);
    const { spots_taken, spots_total } = parseSpots(spotsText);

    const deadline =
      getDetailTableField($, [
        "deadline for preregistration",
        "date limite de preinscription",
      ]) || null;
    const kart_model = getHeroField($, ["kart model", "modele de kart"]) || null;
    const timing =
      getPanelBody($, ["timing"]) ||
      getDetailTableField($, ["length", "duree"]) ||
      null;
    const trackTypeText = getDetailTableField($, ["track type", "type de piste"]);
    const normalizedTrackType = normalizeLabel(trackTypeText);
    const track_type = normalizedTrackType.includes("indoor")
      ? "indoor"
      : normalizedTrackType.includes("outdoor")
        ? "outdoor"
        : null;
    const ballast = parseBallast(getDetailTableField($, ["ballast weight", "lest"]));
    const sws_reference = getDetailTableField($, ["reference"]) || null;
    const comments = getPanelBody($, ["comments", "commentaires"]) || null;

    return {
      id: extractIdFromUrl(calendarEntry.raceUrl),
      circuit_id: matchedCircuit?.id ?? 0,
      title: calendarEntry.title,
      slug: extractRaceSlugFromUrl(calendarEntry.raceUrl),
      date: calendarEntry.date,
      deadline,
      category: calendarEntry.category,
      price,
      currency,
      spots_taken,
      spots_total,
      kart_model,
      timing,
      track_type,
      ballast,
      comments,
      sws_reference,
      sws_url: calendarEntry.raceUrl,
    };
  } catch (error: unknown) {
    console.warn(`  Failed to scrape ${url}:`, error);
    return null;
  }
}

function writeUnmatched(path: string, races: Race[]): void {
  const unmatched = races
    .filter((race) => race.circuit_id === 0)
    .map((race) => ({
      id: race.id,
      title: race.title,
      slug: race.slug,
      sws_url: race.sws_url,
    }));

  writeFileSync(path, `${JSON.stringify(unmatched, null, 2)}\n`, "utf-8");
}

async function main(): Promise<void> {
  const circuitsPath = resolve(DATA_DIR, "circuits.json");
  if (!existsSync(circuitsPath)) {
    console.error("circuits.json not found. Run fetch-circuits.ts first.");
    process.exit(1);
  }

  const dryRun = IS_SMOKE_TEST || process.env.SWS_DRY_RUN === "1";
  const forceRefresh =
    IS_TEST_SCRAPE || process.env.SWS_FORCE_REFRESH === "1";
  const monthsToScrape = readPositiveIntEnv(
    "months",
    "SWS_MONTHS_TO_SCRAPE",
    IS_SMOKE_TEST || IS_TEST_SCRAPE ? 1 : 3
  );
  const startMonthOffset = readNonNegativeIntEnv(
    "start-month-offset",
    "SWS_START_MONTH_OFFSET",
    IS_SMOKE_TEST || IS_TEST_SCRAPE ? 1 : 0
  );
  const calendarPageLimit = readPositiveIntEnv(
    "calendar-pages",
    "SWS_CALENDAR_PAGE_LIMIT",
    IS_SMOKE_TEST || IS_TEST_SCRAPE ? 1 : Number.MAX_SAFE_INTEGER
  );
  const detailLimit = readPositiveIntEnv(
    "limit",
    "SWS_SCRAPE_LIMIT",
    IS_SMOKE_TEST ? 5 : IS_TEST_SCRAPE ? 20 : Number.MAX_SAFE_INTEGER
  );
  const circuits = readJsonFile<Circuit[]>(circuitsPath, []);
  const matcher = createCircuitMatcher(circuits);
  console.log(`Loaded ${circuits.length} circuits for matching`);

  const outputSuffix = IS_TEST_SCRAPE ? ".test" : "";
  const racesPath = resolve(DATA_DIR, `races${outputSuffix}.json`);
  const unmatchedPath = resolve(DATA_DIR, `unmatched${outputSuffix}.json`);
  const cacheRacesPath = resolve(DATA_DIR, "races.json");
  const existingRaces = readJsonFile<Race[]>(cacheRacesPath, []);
  const existingById = new Map(existingRaces.map((race) => [race.id, race]));
  console.log(`${existingById.size} existing races loaded`);
  if (IS_TEST_SCRAPE) {
    console.log("Test scrape active: output will be written to races.test.json");
  }

  const now = new Date();
  const months: { year: number; month: number }[] = [];
  for (let index = 0; index < monthsToScrape; index++) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() + startMonthOffset + index,
      1
    );
    months.push({ year: date.getFullYear(), month: date.getMonth() + 1 });
  }

  console.log("\n=== Step 1: Calendar scraping ===");
  const allEntries: CalendarEntry[] = [];
  for (const { year, month } of months) {
    const entries = await scrapeCalendarMonth(year, month, calendarPageLimit);
    allEntries.push(...entries);
    await sleep(REQUEST_DELAY_MS);
  }

  const today = now.toISOString().slice(0, 10);
  const futureEntries = allEntries.filter((entry) => entry.date >= today);
  const uniqueEntries = new Map<string, CalendarEntry>();
  for (const entry of futureEntries) {
    uniqueEntries.set(extractIdFromUrl(entry.raceUrl), entry);
  }

  const entriesToProcess = Array.from(uniqueEntries.entries()).slice(0, detailLimit);
  console.log(`\n${uniqueEntries.size} unique future races found`);
  if (entriesToProcess.length < uniqueEntries.size) {
    console.log(`Detail limit active: processing ${entriesToProcess.length} races`);
  }

  console.log("\n=== Step 2: Race detail scraping ===");
  const newRaces: Race[] = [];
  let scraped = 0;
  let skipped = 0;

  for (const [id, entry] of entriesToProcess) {
    const existing = existingById.get(id);
    const hoursUntilRace =
      (new Date(entry.date).getTime() - now.getTime()) / (1000 * 60 * 60);

    if (
      !forceRefresh &&
      existing &&
      hoursUntilRace > 48 &&
      !raceNeedsRefresh(existing)
    ) {
      newRaces.push(existing);
      skipped++;
      continue;
    }

    console.log(`  [${scraped + 1}] ${entry.title} (${entry.date}) - ${entry.circuitSlug}`);
    const race = await scrapeRaceDetail(entry, matcher);
    if (race) newRaces.push(race);
    scraped++;

    await sleep(REQUEST_DELAY_MS);

    if (!dryRun && scraped % 50 === 0) {
      writeFileSync(racesPath, `${JSON.stringify(newRaces, null, 2)}\n`, "utf-8");
      console.log(`  Saved ${newRaces.length} races so far`);
    }
  }

  newRaces.sort((a, b) => a.date.localeCompare(b.date));

  if (!dryRun) {
    writeFileSync(racesPath, `${JSON.stringify(newRaces, null, 2)}\n`, "utf-8");
    writeUnmatched(unmatchedPath, newRaces);
  }

  console.log("\nDone");
  console.log(`  Scraped: ${scraped} | Skipped cached: ${skipped}`);
  console.log(`  Total races in output: ${newRaces.length}`);
  console.log(`  Output: ${dryRun ? "(dry run, no files written)" : racesPath}`);

  const unmatched = newRaces.filter((race) => race.circuit_id === 0);
  if (unmatched.length > 0) {
    console.warn(`\n${unmatched.length} races could not be matched to a circuit`);
    unmatched
      .slice(0, 10)
      .forEach((race) => console.warn(`  - ${race.id}: ${race.title} (${race.slug})`));
    if (!dryRun) console.warn(`  Full list written to ${unmatchedPath}`);
  }

  const withPrice = newRaces.filter((race) => race.price !== null);
  const withSpots = newRaces.filter((race) => race.spots_total !== null);
  console.log(`\n  With price: ${withPrice.length}/${newRaces.length}`);
  console.log(`  With spots: ${withSpots.length}/${newRaces.length}`);
}

main().catch((error: unknown) => {
  console.error("Fatal:", error);
  process.exit(1);
});
