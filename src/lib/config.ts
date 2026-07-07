export const SWS_BASE_URL = "https://www.sodiwseries.com";

export const SWS_ENDPOINTS = {
  circuits: `${SWS_BASE_URL}/en-gb/tracks/get_marker`,
  racesCalendar: (locale: string, year: number, month: number) =>
    `${SWS_BASE_URL}/${locale}/races/${year}/${String(month).padStart(2, "0")}`,
  raceDetail: (locale: string, circuitSlug: string, raceSlug: string) =>
    `${SWS_BASE_URL}/${locale}/races/${circuitSlug}/${raceSlug}`,
} as const;

export const SWS_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "X-Requested-With": "XMLHttpRequest",
} as const;

/** Locale to use for scraping based on country ISO code */
export function getSwsLocale(countryIso: string): string {
  return countryIso.toLowerCase() === "fr" ? "fr-fr" : "en-gb";
}

/** Delay between SWS requests (ms); can be lowered for local smoke tests. */
export const SWS_REQUEST_DELAY_MS = Number.parseInt(
  process.env.SWS_REQUEST_DELAY_MS ?? "1000",
  10
);

/** Network timeout for SWS requests (ms). */
export const SWS_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.SWS_FETCH_TIMEOUT_MS ?? "15000",
  10
);

/** Currency by country ISO */
export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  fr: "EUR", de: "EUR", it: "EUR", es: "EUR", be: "EUR", nl: "EUR",
  at: "EUR", pt: "EUR", fi: "EUR", ie: "EUR", lu: "EUR", gr: "EUR",
  sk: "EUR", si: "EUR", ee: "EUR", lv: "EUR", lt: "EUR", cy: "EUR",
  mt: "EUR", hr: "EUR",
  gb: "GBP", uk: "GBP",
  ch: "CHF", li: "CHF",
  pl: "PLN",
  cz: "CZK",
  dk: "DKK",
  se: "SEK",
  no: "NOK",
  hu: "HUF",
  ro: "RON",
  bg: "BGN",
  tr: "TRY",
  ru: "RUB",
  ua: "UAH",
  al: "ALL",
  am: "AMD",
  aw: "AWG",
  az: "AZN",
  bw: "BWP",
  by: "BYN",
  cr: "CRC",
  do: "DOP",
  dz: "DZD",
  ec: "USD",
  eg: "EGP",
  ge: "GEL",
  id: "IDR",
  jo: "JOD",
  ke: "KES",
  kz: "KZT",
  lb: "LBP",
  lk: "LKR",
  md: "MDL",
  na: "NAD",
  nc: "XPF",
  pa: "PAB",
  pe: "PEN",
  ph: "PHP",
  pk: "PKR",
  rs: "RSD",
  sn: "XOF",
  vn: "VND",
  zw: "USD",
  ae: "AED",
  sa: "SAR",
  qa: "QAR",
  bh: "BHD",
  kw: "KWD",
  om: "OMR",
  cn: "CNY",
  jp: "JPY",
  kr: "KRW",
  th: "THB",
  my: "MYR",
  sg: "SGD",
  au: "AUD",
  nz: "NZD",
  ca: "CAD",
  us: "USD",
  mx: "MXN",
  br: "BRL",
  ar: "ARS",
  cl: "CLP",
  co: "COP",
  za: "ZAR",
  ma: "MAD",
  tn: "TND",
  in: "INR",
};
