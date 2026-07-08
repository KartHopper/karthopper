"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

interface DecorativeMarker {
  top: string;
  left: string;
  color: string;
  count: string;
}

interface MapPreviewCardProps {
  imageUrl: string | null;
  alt: string;
  badgeText: string;
  markers: readonly DecorativeMarker[];
}

export function MapPreviewCard({ imageUrl, alt, badgeText, markers }: MapPreviewCardProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;

    // MapTiler renvoie un PNG "Invalid key" valide avec un statut non-2xx :
    // le décodage <img> réussit quand même, donc onError ne se déclenche pas.
    // On vérifie le statut explicitement avant d'afficher l'image.
    fetch(imageUrl)
      .then((response) => {
        if (!cancelled && response.ok) setResolvedSrc(imageUrl);
      })
      .catch(() => {
        // Silencieux : le fallback slate-800 ci-dessous couvre déjà ce cas.
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return (
    <Link
      href="/map"
      className="relative block overflow-hidden rounded-2xl border border-slate-700 shadow-panel focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2"
    >
      {resolvedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- image externe MapTiler, next/image exigerait un domaine autorisé hors périmètre
        <img src={resolvedSrc} alt={alt} loading="lazy" className="h-auto w-full" />
      ) : (
        <div className="aspect-3/2 bg-slate-800" />
      )}

      {markers.map((marker, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{ top: marker.top, left: marker.left, backgroundColor: marker.color }}
          className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-card"
        >
          {marker.count}
        </span>
      ))}

      <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-card">
        {badgeText}
      </span>
    </Link>
  );
}
