"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface CircuitPhotoProps {
  src: string;
  alt: string;
}

export function CircuitPhoto({ src, alt }: CircuitPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="flex aspect-video w-full max-w-2xl items-center justify-center rounded-lg bg-slate-100">
        <ImageOff className="h-10 w-10 text-slate-400" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- image SWS hotlinkée, pas d'optimisation next/image
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-video w-full max-w-2xl rounded-lg bg-slate-100 object-cover"
    />
  );
}
