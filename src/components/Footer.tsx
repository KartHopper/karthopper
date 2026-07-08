import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} KartHopper</p>
        <nav className="flex items-center gap-4">
          <Link
            href="/mentions-legales"
            className="rounded-lg px-1 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {t("footer.legalNotice")}
          </Link>
          <Link
            href="/confidentialite"
            className="rounded-lg px-1 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {t("footer.privacy")}
          </Link>
        </nav>
        <p>{t("footer.madeWith")}</p>
      </div>
    </footer>
  );
}
