import type { StyleSpecification } from "maplibre-gl";

const POSITRON_BASE_URL = "https://api.maptiler.com/maps/positron/style.json";

let cachedStyle: StyleSpecification | null = null;
let cachedApiKey: string | null = null;

function patchLayer(layer: StyleSpecification["layers"][number]): void {
  const id = layer.id.toLowerCase();

  if (id.includes("background") && layer.type === "background") {
    layer.paint = { ...layer.paint, "background-color": "#F8FAFC" };
    return;
  }

  if (id.includes("waterway") && layer.type === "line") {
    layer.paint = { ...layer.paint, "line-color": "#BFDBFE" };
    return;
  }

  if (id.includes("water") && layer.type === "fill") {
    layer.paint = { ...layer.paint, "fill-color": "#DBEAFE" };
    return;
  }

  if (
    (id.includes("park") || id.includes("grass") || id.includes("wood") || id.includes("landcover")) &&
    layer.type === "fill"
  ) {
    layer.paint = { ...layer.paint, "fill-color": "#DCFCE7" };
    return;
  }

  if ((id.includes("motorway") || id.includes("trunk")) && layer.type === "line") {
    layer.paint = { ...layer.paint, "line-color": "#CBD5E1" };
    return;
  }

  if (
    (id.includes("road") || id.includes("street") || id.includes("highway") || id.includes("transportation")) &&
    layer.type === "line"
  ) {
    layer.paint = { ...layer.paint, "line-color": "#E2E8F0" };
    return;
  }

  if ((id.includes("place") || id.includes("label")) && layer.type === "symbol") {
    layer.paint = { ...layer.paint, "text-color": "#64748B" };
  }
}

/** Charge le style Positron MapTiler et applique la palette KartHopper (DA §5). */
export async function loadKartHopperMapStyle(apiKey: string): Promise<StyleSpecification> {
  if (cachedStyle && cachedApiKey === apiKey) {
    return cachedStyle;
  }

  const response = await fetch(`${POSITRON_BASE_URL}?key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`Échec du chargement du style de carte (${response.status})`);
  }

  const style = (await response.json()) as StyleSpecification;
  for (const layer of style.layers) {
    patchLayer(layer);
  }

  cachedStyle = style;
  cachedApiKey = apiKey;
  return style;
}
