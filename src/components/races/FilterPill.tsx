"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

interface FilterPillProps {
  id: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  disabled?: boolean;
  disabledTitle?: string;
  children: React.ReactNode;
}

export function FilterPill({
  id,
  icon: Icon,
  label,
  active,
  disabled = false,
  disabledTitle,
  children,
}: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        title={disabled ? disabledTitle : undefined}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
          active
            ? "border-kart-500 bg-kart-50 text-kart-700"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={id}
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-panel"
        >
          {children}
        </div>
      )}
    </div>
  );
}
