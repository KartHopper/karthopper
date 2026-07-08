import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { CircuitPhoto } from "@/components/circuit/CircuitPhoto";
import { VisitToggle } from "@/components/passport/VisitToggle";
import { RaceCard } from "@/components/races/RaceCard";
import { findCircuitBySlug, loadCircuits, loadRaces } from "@/lib/data";
import { getReferenceDate } from "@/lib/reference-date";
import { groupRacesIntoEvents, upcomingRaces } from "@/lib/races";

export const dynamicParams = false;

export function generateStaticParams() {
  return loadCircuits().map((circuit) => ({ slug: circuit.slug }));
}

interface CircuitPageParams {
  locale: string;
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<CircuitPageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const circuit = findCircuitBySlug(slug);
  if (!circuit) return {};

  setRequestLocale(locale);
  const t = await getTranslations();
  return {
    title: `${circuit.name} — Karting ${circuit.city}, ${circuit.country} | KartHopper`,
    description: t("circuit.metaDescription", {
      name: circuit.name,
      city: circuit.city,
      country: circuit.country,
    }),
  };
}

export default async function CircuitPage({
  params,
}: {
  params: Promise<CircuitPageParams>;
}) {
  const { locale, slug } = await params;
  const circuit = findCircuitBySlug(slug);
  if (!circuit) notFound();

  setRequestLocale(locale);
  const t = await getTranslations();
  const races = loadRaces();
  const referenceDate = getReferenceDate();
  const upcoming = upcomingRaces(races, referenceDate).filter(
    (race) => race.circuit_id === circuit.id
  );
  const events = groupRacesIntoEvents(upcoming);
  const trackType = upcoming.find((race) => race.track_type !== null)?.track_type ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: circuit.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: circuit.address,
      addressLocality: circuit.city,
      addressCountry: circuit.country_iso.toUpperCase(),
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: circuit.lat,
      longitude: circuit.lng,
    },
    url: circuit.sws_url,
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <Link
        href="/map"
        className="self-start rounded-lg text-sm font-medium text-kart-700 hover:underline focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
      >
        ← {t("nav.map")}
      </Link>

      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">{circuit.name}</h1>
        <div className="mt-1 flex items-center gap-2 text-slate-500">
          <span>
            {circuit.city}, {circuit.country}
          </span>
          {trackType && (
            <Badge variant={trackType}>
              {t(trackType === "indoor" ? "circuit.indoor" : "circuit.outdoor")}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <VisitToggle circuitId={circuit.id} />
        </div>
      </div>

      <CircuitPhoto
        src={circuit.photo_url}
        alt={t("circuit.photoAlt", { name: circuit.name })}
      />

      <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
        {circuit.address && (
          <div>
            <dt className="text-slate-500">{t("circuit.address")}</dt>
            <dd className="text-slate-900">{circuit.address}</dd>
          </div>
        )}
        {circuit.phone && (
          <div>
            <dt className="text-slate-500">{t("circuit.phone")}</dt>
            <dd>
              <a
                href={`tel:${circuit.phone}`}
                className="text-kart-700 hover:underline focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
              >
                {circuit.phone}
              </a>
            </dd>
          </div>
        )}
        {circuit.website && (
          <div>
            <dt className="text-slate-500">{t("circuit.website")}</dt>
            <dd>
              <a
                href={circuit.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-kart-700 hover:underline focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
              >
                {circuit.website}
              </a>
            </dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500">SWS</dt>
          <dd>
            <a
              href={circuit.sws_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-kart-700 hover:underline focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
            >
              {t("circuit.viewOnSws")}
            </a>
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="font-heading text-xl font-semibold text-slate-900">
          {t("circuit.upcomingTitle")}
        </h2>
        <div className="mt-3">
          {events.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t("circuit.noUpcoming")}
              description=""
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {events.map((event) => (
                <li key={event.key}>
                  <RaceCard
                    race={event.representative}
                    circuit={circuit}
                    distanceKm={null}
                    locale={locale}
                    mancheCount={event.mancheCount}
                    selected={false}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
