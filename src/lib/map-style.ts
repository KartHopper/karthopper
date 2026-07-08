import type { StyleSpecification } from "maplibre-gl";

const POSITRON_BASE_URL = "https://api.maptiler.com/maps/positron/style.json";

let cachedStyle: StyleSpecification | null = null;
let cachedKey: string | null = null;

type StyleLayer = StyleSpecification["layers"][number];
type SymbolLayer = Extract<StyleLayer, { type: "symbol" }>;
type TextField = NonNullable<SymbolLayer["layout"]>["text-field"];

/**
 * Étiquette localisée : nom dans la langue de l'UI, sinon translittération latine,
 * sinon nom local (fallbacks pour les lieux sans traduction dans les tuiles).
 */
function localizedTextField(locale: string): TextField {
  return [
    "coalesce",
    ["get", `name:${locale}`],
    ["get", "name:latin"],
    ["get", "name"],
  ] as unknown as TextField;
}

function patchLayer(layer: StyleLayer, locale: string): void {
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

  if (layer.type === "symbol" && layer.layout) {
    // Localiser les étiquettes qui affichent un nom (villes, pays, cours d'eau…),
    // sans toucher aux libellés type {ref} (numéros de route).
    const textField = layer.layout["text-field"];
    if (textField !== undefined && JSON.stringify(textField).includes("name")) {
      layer.layout = { ...layer.layout, "text-field": localizedTextField(locale) };
    }

    if (id.includes("place") || id.includes("label")) {
      layer.paint = { ...layer.paint, "text-color": "#64748B" };
    }
  }
}

/** Charge le style Positron MapTiler et applique la palette KartHopper (DA §5) + labels localisés. */
export async function loadKartHopperMapStyle(
  apiKey: string,
  locale: string
): Promise<StyleSpecification> {
  const key = `${apiKey}|${locale}`;
  if (cachedStyle && cachedKey === key) {
    return cachedStyle;
  }

  const response = await fetch(`${POSITRON_BASE_URL}?key=${apiKey}`);
  if (!response.ok) {
    throw new Error(`Échec du chargement du style de carte (${response.status})`);
  }

  const style = (await response.json()) as StyleSpecification;
  for (const layer of style.layers) {
    patchLayer(layer, locale);
  }

  cachedStyle = style;
  cachedKey = key;
  return style;
}
