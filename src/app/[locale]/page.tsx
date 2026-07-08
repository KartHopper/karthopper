import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin } from "lucide-react";
import { loadCircuits } from "@/lib/data";

export default function HomePage() {
  const t = useTranslations();
  const circuits = loadCircuits();
  const countries = new Set(circuits.map((circuit) => circuit.country_iso)).size;

  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-kart-50">
        <MapPin className="h-10 w-10 text-kart-500" aria-hidden="true" />
      </div>

      <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        {t("home.heroTitle")}
      </h1>

      <p className="mt-6 max-w-2xl text-lg text-slate-500">
        {t("home.heroSubtitle")}
      </p>

      <Link
        href="/map"
        className="mt-10 inline-flex items-center gap-2 rounded-lg bg-kart-500 px-6 py-3 font-heading font-medium text-white transition-colors motion-reduce:transition-none hover:bg-kart-400 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
      >
        <MapPin className="h-5 w-5" aria-hidden="true" />
        {t("home.cta")}
      </Link>

      <p className="mt-6 text-sm text-slate-400">
        {t("home.circuitsCount", { count: circuits.length, countries })}
      </p>
    </div>
  );
}
