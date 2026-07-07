export type RaceCategory = "sprint" | "endurance" | "junior" | "other";
export type EnrichmentConfidence = "high" | "medium" | "low" | "none";
export type DurationSource =
  | "timing"
  | "comments"
  | "timing_and_comments"
  | "not_found";
export type SpotsSource =
  | "structured_sws"
  | "timing"
  | "comments"
  | "not_found";

export interface RaceEnrichment {
  provider: string;
  model: string;
  enriched_at: string;
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

export interface Race {
  id: string;
  circuit_id: number;
  title: string;
  slug: string;
  date: string;
  deadline: string | null;
  category: RaceCategory;
  price: number | null;
  currency: string;
  spots_taken: number | null;
  spots_total: number | null;
  kart_model: string | null;
  timing: string | null;
  track_type: "indoor" | "outdoor" | null;
  ballast: boolean | null;
  comments: string | null;
  sws_reference: string | null;
  sws_url: string;
  enrichment?: RaceEnrichment;
}
