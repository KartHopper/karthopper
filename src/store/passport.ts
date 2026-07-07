import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PassportExport } from "@/types/passport";

/**
 * Clé = circuit_id (id SWS stable, voir PLAN_V1 D3) ; le pays se déduit de
 * circuits.json via country_iso, pas dupliqué ici.
 */
interface PassportStore {
  visits: Record<number, string>; // circuit_id -> marked_at ISO
  toggleVisit(circuitId: number): void;
  isVisited(circuitId: number): boolean;
  toExport(): PassportExport;
  importFrom(data: unknown): boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidVisit(value: unknown): value is { circuit_id: number; marked_at: string } {
  return (
    isRecord(value) &&
    typeof value.circuit_id === "number" &&
    typeof value.marked_at === "string"
  );
}

function isPassportExport(data: unknown): data is PassportExport {
  return (
    isRecord(data) &&
    data.schema_version === 1 &&
    typeof data.exported_at === "string" &&
    Array.isArray(data.visits) &&
    data.visits.every(isValidVisit)
  );
}

export const usePassportStore = create<PassportStore>()(
  persist(
    (set, get) => ({
      visits: {},
      toggleVisit: (circuitId) =>
        set((state) => {
          const next = { ...state.visits };
          if (next[circuitId]) {
            delete next[circuitId];
          } else {
            next[circuitId] = new Date().toISOString();
          }
          return { visits: next };
        }),
      isVisited: (circuitId) => circuitId in get().visits,
      toExport: () => ({
        schema_version: 1,
        exported_at: new Date().toISOString(),
        visits: Object.entries(get().visits).map(([circuitId, markedAt]) => ({
          circuit_id: Number(circuitId),
          marked_at: markedAt,
        })),
      }),
      importFrom: (data) => {
        if (!isPassportExport(data)) return false;

        set((state) => {
          const next = { ...state.visits };
          for (const visit of data.visits) {
            const existing = next[visit.circuit_id];
            if (!existing || visit.marked_at < existing) {
              next[visit.circuit_id] = visit.marked_at;
            }
          }
          return { visits: next };
        });
        return true;
      },
    }),
    { name: "karthopper.passport.v1", version: 1 }
  )
);
