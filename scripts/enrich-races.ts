/**
 * Enrich scraped SWS race data with AI-extracted duration and optional spot hints.
 * Outputs a separate JSON file by default; it does not overwrite scraped SWS data.
 *
 * Examples:
 *   npm run data:enrich-races:test
 *   npm run data:enrich-races:test -- --provider=gemini --model=gemini-2.5-flash
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  DurationSource,
  EnrichmentConfidence,
  Race,
  RaceEnrichment,
  SpotsSource,
} from "../src/types/race";

const DATA_DIR = resolve(process.cwd(), "public/data");

type AiProvider = "groq" | "gemini";

interface ModelEnrichment {
  driving_duration_minutes: number | null;
  event_driving_duration_minutes: number | null;
  event_race_ids: string[];
  qualifying_minutes: number | null;
  practice_minutes: number | null;
  race_format: string | null;
  spots_taken_inferred: number | null;
  spots_total_inferred: number | null;
  duration_confidence: EnrichmentConfidence;
  spots_confidence: EnrichmentConfidence;
  duration_source: DurationSource;
  spots_source: SpotsSource;
  needs_review: boolean;
  notes: string | null;
}

interface ProviderConfig {
  provider: AiProvider;
  model: string;
  apiKey: string;
  delayMs: number;
  timeoutMs: number;
}

interface EnrichOptions {
  inputFile: string;
  outputFile: string;
  limit: number;
  offset: number;
  force: boolean;
  dryRun: boolean;
  config: ProviderConfig;
}

interface RaceContext {
  race: Race;
  eventKey: string;
  eventRaces: Race[];
}

const enrichmentSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    driving_duration_minutes: {
      type: ["integer", "null"],
      description:
        "Real driving time in minutes for the current SWS page only, excluding briefing, registration, podium, pauses and unpaid optional practice.",
    },
    event_driving_duration_minutes: {
      type: ["integer", "null"],
      description:
        "Total real driving time in minutes across all included SWS pages for the same event and same participant path. Sum explicit minute-based driving sessions only.",
    },
    event_race_ids: {
      type: "array",
      description:
        "SWS page ids included in event_driving_duration_minutes. Include the current page id when a total is found.",
      items: { type: "string" },
    },
    qualifying_minutes: {
      type: ["integer", "null"],
      description:
        "Total qualifying time in minutes when explicitly stated. Null if only laps are provided.",
    },
    practice_minutes: {
      type: ["integer", "null"],
      description:
        "Included practice/free practice time in minutes. Null for optional paid practice or unclear practice.",
    },
    race_format: {
      type: ["string", "null"],
      description:
        "Short human-readable format, e.g. '5 min qualifying + 3 x 12 min races'.",
    },
    spots_taken_inferred: {
      type: ["integer", "null"],
      description:
        "Only infer from explicit free text such as '12 registered drivers'. Never guess.",
    },
    spots_total_inferred: {
      type: ["integer", "null"],
      description:
        "Only infer from explicit free text such as 'max 30 drivers' or 'limited to 20 places'. Never guess.",
    },
    duration_confidence: {
      type: "string",
      enum: ["high", "medium", "low", "none"],
    },
    spots_confidence: {
      type: "string",
      enum: ["high", "medium", "low", "none"],
    },
    duration_source: {
      type: "string",
      enum: ["timing", "comments", "timing_and_comments", "not_found"],
    },
    spots_source: {
      type: "string",
      enum: ["structured_sws", "timing", "comments", "not_found"],
    },
    needs_review: {
      type: "boolean",
      description:
        "True when the text is ambiguous, lap-only, contradictory, or the extracted value is low confidence.",
    },
    notes: {
      type: ["string", "null"],
      description:
        "Short explanation in English. Mention ambiguity, lap-only formats, or why a value is null.",
    },
  },
  required: [
    "driving_duration_minutes",
    "event_driving_duration_minutes",
    "event_race_ids",
    "qualifying_minutes",
    "practice_minutes",
    "race_format",
    "spots_taken_inferred",
    "spots_total_inferred",
    "duration_confidence",
    "spots_confidence",
    "duration_source",
    "spots_source",
    "needs_review",
    "notes",
  ],
} as const;

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function readArgValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function readPositiveInt(name: string, envName: string, fallback: number): number {
  const raw = readArgValue(name) ?? process.env[envName];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readNonNegativeInt(
  name: string,
  envName: string,
  fallback: number
): number {
  const raw = readArgValue(name) ?? process.env[envName];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function readJsonFile<T>(path: string): T {
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }

  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function numberValue(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArrayValue(
  record: Record<string, unknown>,
  key: string
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) return [];

  return value.filter((item): item is string => typeof item === "string");
}

function booleanValue(record: Record<string, unknown>, key: string): boolean | null {
  const value = record[key];
  return typeof value === "boolean" ? value : null;
}

function enumValue<T extends string>(
  record: Record<string, unknown>,
  key: string,
  allowed: readonly T[]
): T | null {
  const value = record[key];
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : null;
}

function parseModelEnrichment(rawText: string): ModelEnrichment {
  const parsed: unknown = JSON.parse(rawText);
  if (!isRecord(parsed)) throw new Error("AI response is not an object");

  const durationConfidence = enumValue(parsed, "duration_confidence", [
    "high",
    "medium",
    "low",
    "none",
  ] as const);
  const spotsConfidence = enumValue(parsed, "spots_confidence", [
    "high",
    "medium",
    "low",
    "none",
  ] as const);
  const durationSource = enumValue(parsed, "duration_source", [
    "timing",
    "comments",
    "timing_and_comments",
    "not_found",
  ] as const);
  const spotsSource = enumValue(parsed, "spots_source", [
    "structured_sws",
    "timing",
    "comments",
    "not_found",
  ] as const);
  const needsReview = booleanValue(parsed, "needs_review");

  if (
    durationConfidence === null ||
    spotsConfidence === null ||
    durationSource === null ||
    spotsSource === null ||
    needsReview === null
  ) {
    throw new Error("AI response failed enum/boolean validation");
  }

  return {
    driving_duration_minutes: numberValue(parsed, "driving_duration_minutes"),
    event_driving_duration_minutes: numberValue(
      parsed,
      "event_driving_duration_minutes"
    ),
    event_race_ids: stringArrayValue(parsed, "event_race_ids"),
    qualifying_minutes: numberValue(parsed, "qualifying_minutes"),
    practice_minutes: numberValue(parsed, "practice_minutes"),
    race_format: stringValue(parsed, "race_format"),
    spots_taken_inferred: numberValue(parsed, "spots_taken_inferred"),
    spots_total_inferred: numberValue(parsed, "spots_total_inferred"),
    duration_confidence: durationConfidence,
    spots_confidence: spotsConfidence,
    duration_source: durationSource,
    spots_source: spotsSource,
    needs_review: needsReview,
    notes: stringValue(parsed, "notes"),
  };
}

function truncate(value: string | null, maxLength: number): string {
  if (!value) return "";
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}

function normalizeEventTitle(title: string): string {
  let value = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  value = value.replace(/\bacademy\s+\d+\s+heat\b/g, "academy heat");
  value = value.replace(
    /\([^)]*(?:q\d*|race|course|manche|heat|final|session|\d+\s*\/\s*\d+)[^)]*\)/g,
    " "
  );
  value = value.replace(/^\s*(?:s|q|r)\s*\d+\s*[-:]\s*/g, "");
  value = value.replace(/^\s*(?:finale?|race|course|manche|heat|session)\s*\d*\s*[-:]\s*/g, "");
  value = value.replace(/\b(?:qualif(?:ying)?|qualification|race|course|manche|heat|session|s|q|r)\s*#?\s*\d+\b/g, " ");
  value = value.replace(/\b(?:finale?|final)\b/g, " ");
  value = value.replace(/\s+[a-z]\s*$/g, "");
  value = value.replace(/[^a-z0-9#]+/g, " ").replace(/\s+/g, " ").trim();

  return value.length >= 3 ? value : "generic-race";
}

function buildEventKey(race: Race): string {
  return [
    race.date,
    String(race.circuit_id),
    race.category,
    normalizeEventTitle(race.title),
  ].join("|");
}

function buildRaceContext(race: Race, races: Race[]): RaceContext {
  const eventKey = buildEventKey(race);
  const eventRaces = races
    .filter((candidate) => buildEventKey(candidate) === eventKey)
    .sort((left, right) => Number(left.id) - Number(right.id));

  return { race, eventKey, eventRaces };
}

function buildPrompt(context: RaceContext): string {
  const { race, eventRaces } = context;

  return [
    "Extract structured race enrichment from SWS karting race text.",
    "",
    "Rules:",
    "- Return only values supported by explicit text.",
    "- Never guess missing spots. If total/taken spots are not explicit, return null.",
    "- If SWS structured spots are already provided, keep inferred spot fields null and set spots_source to structured_sws.",
    "- driving_duration_minutes is for the current SWS page only.",
    "- event_driving_duration_minutes is the total driving time for one participant across all SWS pages belonging to the same event.",
    "- Sum multiple pages such as race 1 + race 2, manche 1 + manche 2, S1 + S2 + final, or Q1/Race1 + Q2/Race2 when they are stages of the same event.",
    "- Do not sum alternative classes, weight groups, age groups, parallel sessions, or clearly separate events.",
    "- event_race_ids must list only the SWS page ids included in event_driving_duration_minutes.",
    "- Driving duration excludes registration, briefing, podium, breaks and optional paid practice.",
    "- Include qualifying in qualifying_minutes, not driving_duration_minutes, unless the text presents it as the full race session and no race duration is available.",
    "- If the event is expressed only in laps with no minutes, keep minute fields null, duration_confidence low, needs_review true.",
    "- Understand French, English, German, Polish, Spanish, Italian, Russian, Ukrainian and other common karting wording.",
    "- Prefer conservative null over invented precision.",
    "",
    "Current SWS page:",
    JSON.stringify(
      {
        id: race.id,
        title: race.title,
        category: race.category,
        structured_spots_taken: race.spots_taken,
        structured_spots_total: race.spots_total,
        timing: truncate(race.timing, 5000),
        comments: truncate(race.comments, 5000),
      },
      null,
      2
    ),
    "",
    "Candidate SWS pages for the same event, pre-grouped by date, circuit, category and normalized title:",
    JSON.stringify(
      eventRaces.map((eventRace) => ({
        id: eventRace.id,
        title: eventRace.title,
        category: eventRace.category,
        structured_spots_taken: eventRace.spots_taken,
        structured_spots_total: eventRace.spots_total,
        timing: truncate(eventRace.timing, 2500),
        comments: truncate(eventRace.comments, 2500),
      })),
      null,
      2
    ),
  ].join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

function getGroqText(payload: unknown): string {
  if (!isRecord(payload)) throw new Error("Groq response is not an object");
  const choices = payload.choices;
  if (!Array.isArray(choices) || !isRecord(choices[0])) {
    throw new Error("Groq response missing choices");
  }

  const message = choices[0].message;
  if (!isRecord(message) || typeof message.content !== "string") {
    throw new Error("Groq response missing message content");
  }

  return message.content;
}

async function enrichWithGroq(
  context: RaceContext,
  config: ProviderConfig
): Promise<ModelEnrichment> {
  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You are a conservative multilingual data extraction engine. Output valid JSON only.",
          },
          { role: "user", content: buildPrompt(context) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "race_enrichment",
            strict: true,
            schema: enrichmentSchema,
          },
        },
      }),
    },
    config.timeoutMs
  );

  if (!response.ok) {
    throw new Error(`Groq HTTP ${response.status}: ${await response.text()}`);
  }

  return parseModelEnrichment(getGroqText(await response.json()));
}

function getGeminiText(payload: unknown): string {
  if (!isRecord(payload)) throw new Error("Gemini response is not an object");
  const candidates = payload.candidates;
  if (!Array.isArray(candidates) || !isRecord(candidates[0])) {
    throw new Error("Gemini response missing candidates");
  }

  const content = candidates[0].content;
  if (!isRecord(content) || !Array.isArray(content.parts)) {
    throw new Error("Gemini response missing content parts");
  }

  const texts = content.parts
    .filter(isRecord)
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string");

  if (texts.length === 0) throw new Error("Gemini response has no text");
  return texts.join("");
}

async function enrichWithGemini(
  context: RaceContext,
  config: ProviderConfig
): Promise<ModelEnrichment> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(context) }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: enrichmentSchema,
        },
      }),
    },
    config.timeoutMs
  );

  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
  }

  return parseModelEnrichment(getGeminiText(await response.json()));
}

async function enrichRace(
  context: RaceContext,
  config: ProviderConfig
): Promise<RaceEnrichment> {
  const enrichment =
    config.provider === "groq"
      ? await enrichWithGroq(context, config)
      : await enrichWithGemini(context, config);

  return {
    provider: config.provider,
    model: config.model,
    enriched_at: new Date().toISOString(),
    ...enrichment,
  };
}

function readProvider(): AiProvider {
  const raw = readArgValue("provider") ?? process.env.KH_AI_PROVIDER ?? "groq";
  if (raw === "groq" || raw === "gemini") return raw;
  throw new Error(`Unsupported AI provider: ${raw}`);
}

function defaultModel(provider: AiProvider): string {
  return provider === "groq"
    ? "meta-llama/llama-4-scout-17b-16e-instruct"
    : "gemini-2.5-flash";
}

function readApiKey(provider: AiProvider): string {
  const argKey = readArgValue("api-key");
  if (argKey) return argKey;

  const envName = provider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
  return process.env[envName] ?? "";
}

function readOptions(): EnrichOptions {
  const isTest = hasFlag("test");
  const provider = readProvider();
  const model =
    readArgValue("model") ?? process.env.KH_AI_MODEL ?? defaultModel(provider);
  const inputFile =
    readArgValue("input") ?? (isTest ? "races.test.json" : "races.json");
  const outputFile =
    readArgValue("output") ??
    (isTest ? "races.enriched.test.json" : "races.enriched.json");

  return {
    inputFile,
    outputFile,
    limit: readPositiveInt("limit", "KH_AI_LIMIT", isTest ? 20 : 200),
    offset: readNonNegativeInt("offset", "KH_AI_OFFSET", 0),
    force: hasFlag("force") || process.env.KH_AI_FORCE === "1",
    dryRun: hasFlag("dry-run"),
    config: {
      provider,
      model,
      apiKey: readApiKey(provider),
      delayMs: readNonNegativeInt(
        "delay-ms",
        "KH_AI_DELAY_MS",
        provider === "groq" ? 2200 : 4000
      ),
      timeoutMs: readPositiveInt("timeout-ms", "KH_AI_TIMEOUT_MS", 30000),
    },
  };
}

async function main(): Promise<void> {
  const options = readOptions();
  const inputPath = resolve(DATA_DIR, options.inputFile);
  const outputPath = resolve(DATA_DIR, options.outputFile);
  const races = readJsonFile<Race[]>(inputPath);
  const selected = races.slice(options.offset, options.offset + options.limit);
  const selectedContexts = selected.map((race) => buildRaceContext(race, races));
  const outputRaces = [...races];

  console.log("KartHopper AI race enrichment");
  console.log(`  Provider: ${options.config.provider}`);
  console.log(`  Model: ${options.config.model}`);
  console.log(`  Input: ${inputPath}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Selected races: ${selected.length}`);
  console.log(
    `  Candidate event groups: ${new Set(selectedContexts.map((context) => context.eventKey)).size}`
  );

  if (options.dryRun) {
    selectedContexts.slice(0, 5).forEach((context) => {
      console.log(
        `  - ${context.race.id}: ${context.race.title} (${context.eventRaces.length} event page(s))`
      );
    });
    console.log("Dry run: no AI calls, no files written");
    return;
  }

  if (!options.config.apiKey) {
    const envName =
      options.config.provider === "groq" ? "GROQ_API_KEY" : "GEMINI_API_KEY";
    throw new Error(`Missing ${envName}. Use --dry-run to inspect without calls.`);
  }

  let enriched = 0;
  let failed = 0;

  for (const context of selectedContexts) {
    const { race } = context;
    const index = outputRaces.findIndex((candidate) => candidate.id === race.id);
    if (index === -1) continue;

    if (
      outputRaces[index].enrichment &&
      outputRaces[index].enrichment.event_race_ids &&
      !options.force
    ) {
      console.log(`  [skip] ${race.id}: already enriched`);
      continue;
    }

    try {
      console.log(
        `  [${enriched + failed + 1}/${selected.length}] ${race.id}: ${race.title} (${context.eventRaces.length} event page(s))`
      );
      outputRaces[index] = {
        ...outputRaces[index],
        enrichment: await enrichRace(context, options.config),
      };
      enriched++;
    } catch (error: unknown) {
      failed++;
      console.warn(`  Failed ${race.id}:`, error);
    }

    if (options.config.delayMs > 0) await sleep(options.config.delayMs);
  }

  writeFileSync(outputPath, `${JSON.stringify(outputRaces, null, 2)}\n`, "utf-8");

  const enrichedTotal = outputRaces.filter((race) => race.enrichment).length;
  const withDuration = outputRaces.filter(
    (race) => race.enrichment?.driving_duration_minutes != null
  ).length;
  const withEventDuration = outputRaces.filter(
    (race) => race.enrichment?.event_driving_duration_minutes != null
  ).length;

  console.log("\nDone");
  console.log(`  Enriched this run: ${enriched}`);
  console.log(`  Failed this run: ${failed}`);
  console.log(`  Enriched in output: ${enrichedTotal}/${outputRaces.length}`);
  console.log(`  With AI driving duration: ${withDuration}/${outputRaces.length}`);
  console.log(`  With AI event duration: ${withEventDuration}/${outputRaces.length}`);
}

main().catch((error: unknown) => {
  console.error("Fatal:", error);
  process.exit(1);
});
