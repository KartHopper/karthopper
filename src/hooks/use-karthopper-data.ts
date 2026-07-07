import { useCallback, useEffect, useState } from "react";
import type { Circuit } from "@/types/circuit";
import type { Race } from "@/types/race";

export interface KarthopperData {
  circuits: Circuit[] | null;
  races: Race[] | null; // TOUTES les courses du seed (le filtrage se fait ailleurs)
  loading: boolean;
  error: boolean;
  retry(): void;
}

export function useKarthopperData(): KarthopperData {
  const [circuits, setCircuits] = useState<Circuit[] | null>(null);
  const [races, setRaces] = useState<Race[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/data/circuits.json").then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Circuit[]>;
      }),
      fetch("/data/races.json").then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Race[]>;
      }),
    ])
      .then(([circuitsData, racesData]) => {
        if (cancelled) return;
        setCircuits(circuitsData);
        setRaces(racesData);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(false);
    setAttempt((value) => value + 1);
  }, []);

  return { circuits, races, loading, error, retry };
}
