"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Circle } from "lucide-react";
import { usePassportStore } from "@/store/passport";

interface VisitToggleProps {
  circuitId: number;
  size?: "sm" | "md";
}

export function VisitToggle({ circuitId, size = "md" }: VisitToggleProps) {
  const t = useTranslations();
  const [mounted, setMounted] = useState(false);
  const isVisited = usePassportStore((state) => state.isVisited(circuitId));
  const toggleVisit = usePassportStore((state) => state.toggleVisit);

  useEffect(() => {
    // Nécessaire pour éviter un mismatch d'hydratation : le store persist
    // (localStorage) n'est disponible qu'après le montage côté client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const visited = mounted && isVisited;
  const sizeClasses = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm";
  const iconSizeClasses = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={() => toggleVisit(circuitId)}
      aria-pressed={visited}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 ${sizeClasses} ${
        visited
          ? "border-kart-500 bg-kart-50 text-kart-700"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {visited ? (
        <CheckCircle2 className={iconSizeClasses} aria-hidden="true" />
      ) : (
        <Circle className={iconSizeClasses} aria-hidden="true" />
      )}
      {visited ? t("passport.visited") : t("passport.markVisited")}
    </button>
  );
}
