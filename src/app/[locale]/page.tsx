import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flag, LocateFixed, MapPin, SlidersHorizontal, Stamp } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MapPreviewCard } from "@/components/MapPreviewCard";
import { loadCircuits, loadRaces } from "@/lib/data";
import { upcomingRaces } from "@/lib/races";
import { getReferenceDate } from "@/lib/reference-date";

const DECORATIVE_MARKERS = [
  { top: "38%", left: "32%", color: "#FF5A1F", count: "5" },
  { top: "30%", left: "55%", color: "#2563EB", count: "3" },
  { top: "62%", left: "48%", color: "#FF5A1F", count: "12" },
  { top: "55%", left: "70%", color: "#16A34A", count: "2" },
] as const;

export default function HomePage() {
  const t = useTranslations();
  const circuits = loadCircuits();
  const countries = new Set(circuits.map((circuit) => circuit.country_iso)).size;
  const raceCount = upcomingRaces(loadRaces(), getReferenceDate()).length;
  const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const mapPreviewUrl = apiKey
    ? `https://api.maptiler.com/maps/positron/static/4.85,46.6,4.6/720x480@2x.png?key=${apiKey}`
    : null;

  return (
    <div className="flex flex-col">
      <section className="bg-slate-900">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <Logo className="h-12 w-12" />

            <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {t("home.heroTitle")}
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300">{t("home.heroSubtitle")}</p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-lg bg-kart-500 px-6 py-3 font-heading font-medium text-white transition-colors motion-reduce:transition-none hover:bg-kart-400 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
              >
                <MapPin className="h-5 w-5" aria-hidden="true" />
                {t("home.cta")}
              </Link>
              <Link
                href="/map"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-heading font-medium text-kart-400 transition-colors motion-reduce:transition-none hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
              >
                {t("home.ctaSecondary")}
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              {t("home.circuitsCount", { count: circuits.length, countries })}
            </p>
          </div>

          <MapPreviewCard
            imageUrl={mapPreviewUrl}
            alt={t("home.mapPreviewAlt")}
            badgeText={t("home.mapPreviewBadge", { count: raceCount })}
            markers={DECORATIVE_MARKERS}
          />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <h2 className="text-center font-heading text-3xl font-semibold text-slate-900">
          {t("home.howTitle")}
        </h2>

        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            { Icon: LocateFixed, number: "1", title: t("home.step1Title"), text: t("home.step1Text") },
            {
              Icon: SlidersHorizontal,
              number: "2",
              title: t("home.step2Title"),
              text: t("home.step2Text"),
            },
            { Icon: Flag, number: "3", title: t("home.step3Title"), text: t("home.step3Text") },
          ].map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-kart-50 font-heading text-lg font-bold text-kart-700">
                {step.number}
              </div>
              <step.Icon className="mt-4 h-6 w-6 text-kart-700" aria-hidden="true" />
              <h3 className="mt-3 font-heading font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-12 text-center sm:flex-row sm:text-left">
          <Stamp className="h-10 w-10 shrink-0 text-kart-700" aria-hidden="true" />
          <div>
            <h3 className="font-heading font-semibold text-slate-900">
              {t("home.passportTitle")}
            </h3>
            <p className="mt-1 text-slate-600">{t("home.passportText")}</p>
          </div>
          <Link
            href="/map"
            className="shrink-0 rounded-lg px-4 py-2 font-heading font-medium text-kart-700 transition-colors motion-reduce:transition-none hover:bg-kart-50 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
          >
            {t("home.passportCta")}
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-center px-4 py-16 text-center">
        <h2 className="font-heading text-3xl font-semibold text-slate-900">
          {t("home.finalCtaTitle")}
        </h2>
        <Link
          href="/map"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-kart-500 px-6 py-3 font-heading font-medium text-white transition-colors motion-reduce:transition-none hover:bg-kart-400 focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
        >
          <MapPin className="h-5 w-5" aria-hidden="true" />
          {t("home.cta")}
        </Link>
      </section>
    </div>
  );
}
