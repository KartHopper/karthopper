"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Upload } from "lucide-react";
import { usePassportStore } from "@/store/passport";

type Status = { type: "ok"; count: number } | { type: "error" } | null;

export function PassportTransfer() {
  const t = useTranslations();
  const toExport = usePassportStore((state) => state.toExport);
  const importFrom = usePassportStore((state) => state.importFrom);
  const [status, setStatus] = useState<Status>(null);

  function handleExport() {
    const data = toExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "karthopper-passeport.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const ok = importFrom(parsed);
      if (ok) {
        const count = Object.keys(usePassportStore.getState().visits).length;
        setStatus({ type: "ok", count });
      } else {
        setStatus({ type: "error" });
      }
    } catch {
      setStatus({ type: "error" });
    }
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={handleExport}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        {t("passport.export")}
      </button>

      <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-2">
        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
        {t("passport.import")}
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleImportChange}
          className="sr-only"
        />
      </label>

      {status?.type === "ok" && (
        <span className="text-green-700">{t("passport.importOk", { count: status.count })}</span>
      )}
      {status?.type === "error" && (
        <span className="text-red-600">{t("passport.importError")}</span>
      )}
    </div>
  );
}
