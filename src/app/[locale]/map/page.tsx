import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapScreen } from "@/components/map/MapScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("map.metaTitle"),
    description: t("map.metaDescription"),
  };
}

export default function MapPage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <MapScreen />
    </div>
  );
}
