"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Stamp } from "lucide-react";
import { usePassportStore } from "@/store/passport";
import type { Circuit } from "@/types/circuit";

interface PassportSummaryProps {
  circuits: Map<number, Circuit>;
}

export function PassportSummary({ circuits }: PassportSummaryProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const visits = usePassportStore((state) => state.visits);

  useEffect(() => {
    // Nécessaire pour éviter un mismatch d'hydratation (cf. VisitToggle).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const visitedCircuits = mounted
    ? Object.keys(visits)
        .map((id) => circuits.get(Number(id)))
        .filter((circuit): circuit is Circuit => circuit !== undefined)
    : [];
  const countryCount = new Set(visitedCircuits.map((circuit) => circuit.country_iso)).size;

  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
      <Stamp className="h-4 w-4 shrink-0 text-kart-700" aria-hidden="true" />
      {visitedCircuits.length === 0 ? (
        t("passport.emptyHint")
      ) : (
        <span className="tabular-nums">
          {t("passport.summary", { circuits: visitedCircuits.length, countries: countryCount })}
        </span>
      )}
    </p>
  );
}
