"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { MapPin } from "lucide-react";

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale() {
    const next = locale === "fr" ? "en" : "fr";
    router.replace(pathname, { locale: next });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kart-500">
            <MapPin className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-heading text-lg font-bold text-slate-900">
            {t("common.appName")}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/map"
            className="text-sm font-medium text-slate-600 transition-colors motion-reduce:transition-none hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
          >
            {t("nav.map")}
          </Link>

          <button
            onClick={switchLocale}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-sm font-medium text-slate-600 transition-colors motion-reduce:transition-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>
        </nav>
      </div>
    </header>
  );
}
