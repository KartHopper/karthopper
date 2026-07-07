import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <p>&copy; {new Date().getFullYear()} KartHopper</p>
        <p>{t("footer.madeWith")}</p>
      </div>
    </footer>
  );
}
