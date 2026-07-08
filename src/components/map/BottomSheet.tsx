"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";

export type SheetState = "peek" | "half" | "full";

interface BottomSheetProps {
  state: SheetState;
  onStateChange(state: SheetState): void;
  peekContent: React.ReactNode;
  children: React.ReactNode;
}

const HEIGHT_BY_STATE: Record<SheetState, string> = {
  peek: "25dvh",
  half: "50dvh",
  full: "90dvh",
};

const NEXT_STATE: Record<SheetState, SheetState> = {
  peek: "half",
  half: "full",
  full: "peek",
};

function nextUpState(state: SheetState): SheetState {
  if (state === "peek") return "half";
  return "full";
}

function nextDownState(state: SheetState): SheetState {
  if (state === "full") return "half";
  return "peek";
}

export function BottomSheet({ state, onStateChange, peekContent, children }: BottomSheetProps) {
  const t = useTranslations();

  return (
    <section
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl bg-white shadow-panel transition-[height] duration-300 ease-out motion-reduce:transition-none lg:hidden"
      style={{ height: HEIGHT_BY_STATE[state] }}
    >
      <button
        type="button"
        onClick={() => onStateChange(NEXT_STATE[state])}
        aria-label={t("map.sheetToggle")}
        className="flex shrink-0 items-center justify-center py-2 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
      >
        <span className="h-1.5 w-10 rounded-full bg-slate-300" />
      </button>

      <div className="absolute right-3 top-2 flex gap-1">
        <button
          type="button"
          onClick={() => onStateChange(nextUpState(state))}
          aria-label={t("map.sheetUp")}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onStateChange(nextDownState(state))}
          aria-label={t("map.sheetDown")}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {state === "peek" ? (
        <div className="px-4 pb-4">{peekContent}</div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      )}
    </section>
  );
}
