# PLAN_V1 — Plan d'exécution du site KartHopper V1

> Rédigé le 2026-07-07 par l'architecte (session d'audit). Exécutant cible : modèle
> type Sonnet/Haiku. **Aucune décision d'architecture, de design ou de périmètre
> n'est à prendre pendant l'exécution : tout est tranché ici.**

---

## Règles imposées à l'exécutant (à respecter à chaque étape)

- Respecter `CLAUDE.md` et `AGENTS.md` du repo, TypeScript strict (`strict: true`,
  jamais de `any` ni `as any`), ESLint zéro erreur.
- Ne **jamais** mettre à niveau ou ajouter une dépendance non listée dans ce plan.
  (Ce plan n'ajoute **aucune** dépendance npm : tout est déjà dans `package.json`.)
- Aucun refactor hors périmètre ; ne pas toucher aux fichiers non listés dans
  l'étape en cours.
- `npm run lint` **et** `npm run build` doivent être verts à la fin de **chaque**
  étape. Un commit par étape, message au format :
  `V1 L<lot>.<étape> — <description courte>` (ex. `V1 L2.3 — MapView avec clustering`).
  **Push : uniquement `git push origin main` en fin de lot complet** (déclenche le
  déploiement Vercel, décision d'Antoine du 2026-07-07). Jamais de force-push,
  jamais de push en cours de lot.
- Secrets/clés API : uniquement via `.env.local` (jamais committé, déjà couvert par
  `.gitignore` via `.env*`). Si une clé attendue manque (ex. MapTiler), **s'arrêter
  et le signaler** — ne pas mocker en silence, ne pas utiliser un autre fournisseur.
- Ne **jamais** relancer les scripts de scraping SWS en dehors des étapes qui le
  demandent explicitement (le site SWS est protégé par reCAPTCHA, voir Lot 7).
  Ne jamais écraser `public/data/circuits.json` ni `public/data/races.json`.
- En cas d'ambiguïté : s'arrêter et poser la question, ne jamais improviser.
- Conventions du repo : composants React en `PascalCase.tsx`, modules en
  `kebab-case.ts`, imports absolus `@/…`, named exports pour les composants,
  prix/dates via `Intl.NumberFormat`/`Intl.DateTimeFormat`, chiffres en
  `tabular-nums`, jamais `#FF5A1F` (kart-500) pour du texte sur fond blanc
  (utiliser `text-kart-700` = `#C23D0F`).

---

## 1. État des lieux (audit du 2026-07-07)

### Ce qui existe et fonctionne

- **Base Next.js 16.2 (App Router, Turbopack) + Tailwind CSS 4 + next-intl 4** :
  `npm run lint` et `npm run build` sont verts.
- **i18n fr/en** opérationnelle : `src/i18n/{routing,request,navigation}.ts`,
  middleware `src/proxy.ts`, messages `src/messages/{fr,en}.json`, layout
  `src/app/[locale]/layout.tsx`.
- **DA implémentée dans `src/app/globals.css`** : palette `kart-50…900`, couleurs
  catégories (`--color-sprint #FF5A1F`, `--color-endurance #2563EB`,
  `--color-junior #16A34A`, `--color-special #8B5CF6`), shadows `card/card-hover/panel`,
  fonts Space Grotesk + Inter via `next/font` (`src/app/layout.tsx`), tokens shadcn.
- **Composants** : `Header` (nav + switch locale), `Footer`, `Badge` (10 variantes DA),
  `ui/button.tsx` (shadcn). Landing page `src/app/[locale]/page.tsx` (hero + CTA vers `/map`).
- **Types** : `src/types/circuit.ts` (id numérique SWS stable, slug unique vérifié,
  `country_iso` normalisé minuscule, GPS, devise) et `src/types/race.ts`
  (id string SWS, `circuit_id`, date ISO, prix/devise, places, kart, timing, catégorie).
- **Scripts data** : `fetch-circuits.ts`, `scrape-races.ts` (calendrier + fiches,
  incrémental, matching multi-stratégie), `enrich-races.ts` (enrichissement LLM
  expérimental), `validate-data.ts`. Workflows GitHub Actions `fetch-circuits.yml`
  (hebdo) et `scrape-races.yml` (quotidien) présents.
- **Dépendances déjà installées** pour la V1 : `maplibre-gl`, `react-map-gl`,
  `zustand`, `lucide-react`, `next-intl`, `cheerio`.

### La réalité des données (vérifiée par exécution le 2026-07-07)

- `public/data/circuits.json` : **790 circuits réels, 80 pays**, GPS/photos/slug,
  0 doublon de slug, fetché le 2026-05-28. **Utilisable tel quel.**
- `public/data/races.json` : **3307 courses réelles mais toutes passées**
  (2026-03-18 → 2026-05-31, scrape du 19 mars). `spots_total` est null partout
  (le parsing des places a été corrigé après ce scrape : `races.test.json` du
  29 mai a 119/200 courses avec places).
- **BLOQUANT : SWS a déployé un reCAPTCHA.** Vérifié ce jour : le calendrier
  (`/en-gb/races/2026/07`), les fiches courses, `/tracks/get_marker` et `/tracks`
  renvoient tous une page « SWS - reCAPTCHA » (1209 octets), avec le User-Agent
  Googlebot comme avec un UA Chrome, avec ou sans cookie de session. Seule la
  homepage répond normalement. `npm run data:scrape-races:smoke` retourne 0 course.
  → **Le pipeline de scraping est hors service aujourd'hui.** C'était un risque
  identifié dans `CAHIER_DES_CHARGES.md` (« SWS bloque le Googlebot UA »).
- Pas de base Supabase, pas de Redis, pas de `.env.local` : rien de tout cela
  n'est nécessaire en V1 (données = JSON statiques, conforme au cahier des charges
  §3.1 « BDD : Aucune (MVP) »).
- Git : le repo n'a **aucun commit** (tout est staged/untracked sur `master`),
  pas de remote configuré. `next.config.ts` est dans l'index git mais supprimé du
  disque (le build fonctionne sans, mais on le recrée proprement au Lot 0).

### Écarts cahier des charges ↔ code

- Aucune page `/map`, `/circuit/[slug]`, aucune liste de courses : seule la landing existe.
- Pas de Vitest/Playwright installés (prévus par CLAUDE.md) — **hors V1**, voir « Reporté ».
- Pas de `climate.json` (V2, météo) — hors V1.
- Le README est encore le boilerplate create-next-app.

### Décisions déjà tranchées (à ne pas rouvrir)

Stack Next.js/Tailwind/shadcn/MapLibre+MapTiler/Zustand/next-intl ; DA complète
(`DIRECTION_ARTISTIQUE.md`) ; modèle freemium 5 €/mois (V2) ; données servies en
JSON statique committé, pipeline par GitHub Actions ; scraping multilingue fr-fr/en-gb ;
jamais scraper `/drivers/` ni `/teams/`.

---

## 2. Décisions d'architecture V1 (tranchées ici)

### D1 — Données : seed statique committé, pipeline gelé

Le reCAPTCHA rend le pipeline inopérant → la V1 est construite sur le **seed
statique existant** : `circuits.json` (790 circuits réels, frais) et `races.json`
(3307 courses réelles, périmées). L'UI est développée et validée contre ces
données réelles ; la remise en route du pipeline est un chantier séparé (Lot 7 le
documente et sécurise, la réparation est **hors V1** — décision d'Antoine requise,
voir Questions).

### D2 — Date de référence pilotable

Comme le seed ne contient que des courses passées, tout filtrage « à venir »
utilise une **date de référence** : `NEXT_PUBLIC_REFERENCE_DATE` (format
`YYYY-MM-DD`) dans `.env.local`, sinon la date du jour. En dev/recette on met
`NEXT_PUBLIC_REFERENCE_DATE=2026-04-01` (≈ 2600 courses « à venir » dans le seed).
En production, la variable ne sera **pas** définie une fois le pipeline réparé.
C'est le seul mécanisme de test autorisé — pas de données inventées.

### D3 — Modèle de données karthopping-ready (aucune migration cassante plus tard)

- **Identifiant stable de circuit = `Circuit.id`** (id numérique SWS, déjà utilisé
  par `Race.circuit_id`). Le passeport, les visites, badges et profils V2/V3
  référenceront **uniquement** cet id. Le `slug` sert aux URLs, jamais comme clé.
- **Pays normalisé = `country_iso`** (ISO 3166-1 alpha-2 minuscule, déjà en place)
  → compteur pays, badges par pays, classements régionaux V3 sans retraitement.
- **Passeport localStorage versionné** (schéma `schema_version: 1`, voir Lot 5) avec
  export/import JSON dès la V1 → migration sans perte vers un compte utilisateur
  en V2 (il suffira d'un endpoint d'import du même JSON).
- Les types `Race`/`Circuit` existants ne sont **pas modifiés** (le scraper et les
  données committées en dépendent).

### D4 — Zéro nouvelle dépendance, zéro backend

Carte : `react-map-gl` + `maplibre-gl` (installés). État : `zustand` (installé).
Géocodage ville : API **Photon** (`https://photon.komoot.io`, sans clé, décision
cahier des charges §3.6). Distances : haversine maison. Photos circuits : balise
`<img>` native avec fallback en cas d'erreur (pas `next/image` — les images SWS
sont hotlinkées et potentiellement instables, on ne veut pas d'erreur de build ni
de proxy d'optimisation dessus). Pas de Supabase, pas de Redis, pas d'API route.

### D5 — Périmètre pages V1

`/[locale]` (landing, existe), `/[locale]/map` (carte + panneau liste + filtres,
cœur du produit), `/[locale]/circuit/[slug]` (790 × 2 fiches SSG),
`/[locale]/mentions-legales` et `/[locale]/confidentialite` (obligation RGPD V1
du cahier des charges). **Pas** de page course individuelle (le CTA renvoie vers
SWS), pas de vue calendrier.

### D6 — Filtres V1

Exactement : **rayon autour d'une position** (géolocalisation navigateur OU saisie
de ville via Photon), **période** (date début/fin) et **catégorie** (chips
Sprint/Endurance/Junior/Autre — décision Antoine après étude du public cible :
les pilotes SWS courent dans leur catégorie). Tri unique : par date croissante.
Les autres filtres du cahier des charges (prix, pays, kart, places…) sont
reportés — le prix reste **affiché** sur les cartes de course.
S'y ajoutent deux utilitaires sans backend (décision Antoine, même étude) :
**filtres partageables par URL** (query params sur `/map` + bouton copier le
lien — canal d'acquisition pour les équipes) et **export agenda .ics** par
course (les pilotes planifient leur saison : seuls les 16 meilleurs résultats
comptent au classement SWS).

### D7 — Mobile

Layout DA : desktop = panneau latéral fixe 380 px + carte ; mobile = carte plein
écran + bottom sheet à 3 états (peek 25 % / half 50 % / full 90 %). V1 : les états
se changent par **boutons/clic sur la poignée** (cycle) — le drag gesture est
reporté (fragile à implémenter sans lib dédiée).

---

## 3. Périmètre V1 — reporté (ne PAS implémenter)

| Reporté | Justification (une ligne) |
|---|---|
| Comptes utilisateurs / auth Supabase | Inutile pour « trouver sa course en 30 s » ; le passeport localStorage suffit comme hook. |
| Premium / Stripe / page pricing | Rien à vendre tant que l'audience n'existe pas ; modèle freemium intact pour V2. |
| Alertes e-mail / favoris / Resend | Nécessite comptes + backend ; zéro backend en V1. |
| Redis (Upstash) | Aucun cache serveur nécessaire : JSON statiques servis par le CDN Vercel. |
| Budget déplacement (ORS, péages, train, avion, Booking) | Feature premium V2 (F9/F10), la plus coûteuse ; hors proposition de valeur V1. |
| Météo (Open-Meteo, NASA POWER, climate.json) | V2 (F11) ; aucune dépendance V1 dessus. |
| Notation / avis circuits | UGC sans comptes impossible à modérer ; V2 (F12). |
| Badges, classements, profils partageables, Wrapped, sync multi-appareils | Karthopping complet = V2/V3 (F17/F17b) ; le passeport localStorage V1 devra migrer vers le compte V2 **sans perte** grâce à l'export/import JSON livré dès la V1. |
| Filtres prix/pays/kart/places/indoor | Chaque filtre ajoute de l'UI et des états ; rayon + période + catégorie couvrent le job story V1. |
| Coéquipiers endurance (annonces « équipe cherche pilote » par course) | Différenciateur fort validé par l'étude concurrentielle (complémentaire de Stint/thestintlink.com qui gère la stratégie mais pas la découverte) ; nécessite comptes + modération → V2. |
| Indicateur plateau/points (« 32 inscrits — gros plateau ») | Le barème SWS donne plus de points aux gros plateaux ; nécessite `spots_taken` fiable → dépend du pipeline réparé → V2. |
| Catégories SWS fines (Ironkart, e-Sprint, Women Cup, Master 40+) | Aujourd'hui tout tombe dans `other` ; élargir `RaceCategory`, le parseur et les filtres quand des données fraîches permettront de vérifier les classes CSS SWS → V2. |
| Indicateur de niveau des inscrits (perf SWS globale + sur ce circuit) | Idée d'Antoine (2026-07-07) : « ce plateau est-il relevé ? » ; nécessite le scraping des classements SWS (`/rankings/`, aujourd'hui derrière le même reCAPTCHA) et un croisement pilotes/courses → V3, à réévaluer avec la stratégie données. |
| Pages course individuelles SSG + JSON-LD Event | Des milliers de pages dont le contenu périme en jours ; le lien SWS fait le job en V1. |
| Vitest + Playwright + axe-core | Aucun test existant ; on valide par lint + build + tests manuels scriptés ; harnais de test = premier chantier post-V1. |
| Vue calendrier, road trip, mode sombre, push | V3 (F18-F22). |
| Réparation du scraping SWS (captcha) | Impossible à trancher sans Antoine (technique ET légal) ; voir Lot 7 + Questions. |
| Drag gesture du bottom sheet mobile | Reporté (D7) : boutons en V1. |
| Enrichissement LLM (`enrich-races.ts`) | Expérimental (20/200 courses enrichies en test), nécessite clés Groq/Gemini ; hors V1. |

---

## 4. Plan d'exécution

Chaque étape liste : **Fichiers**, **Contenu**, **Vérification**, **Critère
d'acceptation (binaire)**, **Dépendances**. La « vérif standard » =
`npm run lint` puis `npm run build`, les deux sans erreur, puis commit.

**Pré-requis de recette (à faire une fois, avant le Lot 2)** : créer `.env.local`
à la racine avec :

```
NEXT_PUBLIC_MAPTILER_API_KEY=<clé fournie par Antoine — si absente, STOP et signaler>
NEXT_PUBLIC_REFERENCE_DATE=2026-04-01
```

---

### Lot 0 — Baseline (git + config)

#### Étape 0.1 — Commit initial de l'existant

- **Fichiers** : `.gitignore` (modifier), tout l'existant (commit).
- **Contenu** :
  0. Renommer la branche : `git branch -m master main` (aucun commit n'existe,
     l'opération est triviale ; aligne avec le défaut GitHub).
  1. Ajouter à la fin de `.gitignore` :
     ```
     # local claude settings
     .claude/settings.local.json
     ```
  2. `git rm --cached .claude/settings.local.json` (il est actuellement staged),
     `git rm --cached next.config.ts` (staged mais supprimé du disque),
     puis `git add -A` et vérifier avec `git status` que `.env*` et
     `node_modules` ne sont pas inclus.
  3. Commit : `V1 L0.1 — commit initial de l'existant (base Next.js + i18n + DA + scripts data + seed)`.
- **Vérification** : `git log --oneline` montre 1 commit ; `git status` propre
  (hors `.env.local` éventuel) ; vérif standard.
- **Critère** : `git show --stat HEAD` liste `public/data/circuits.json` et
  `public/data/races.json`, et ne liste ni `.claude/settings.local.json` ni `node_modules`.
- **Dépendances** : aucune.

#### Étape 0.2 — `next.config.ts` canonique

- **Fichiers** : créer `next.config.ts`.
- **Contenu** exact :
  ```ts
  import type { NextConfig } from "next";
  import createNextIntlPlugin from "next-intl/plugin";

  const withNextIntl = createNextIntlPlugin();

  const nextConfig: NextConfig = {};

  export default withNextIntl(nextConfig);
  ```
- **Vérification** : vérif standard ; puis `npm run dev`, ouvrir
  `http://localhost:3000/fr` → la landing s'affiche avec le titre FR ; `/en` → EN.
- **Critère** : build vert ET `/fr` + `/en` rendent la landing traduite.
- **Dépendances** : 0.1.

#### Étape 0.3 — README projet + doc données

- **Fichiers** : réécrire `README.md` ; créer `public/data/README.md`.
- **Contenu** :
  - `README.md` : titre KartHopper, une phrase de pitch (reprendre CLAUDE.md),
    section « Démarrer » (`npm install`, créer `.env.local` avec les 2 variables
    ci-dessus, `npm run dev`), section « Données » (renvoyer vers
    `public/data/README.md`), section « Scripts » (tableau des scripts npm
    existants), avertissement : *« Le scraping SWS est actuellement bloqué par un
    reCAPTCHA (constaté le 2026-07-07) — ne pas relancer les scripts data sans
    lire `PIPELINE.md` »*.
  - `public/data/README.md` : provenance et fraîcheur de chaque fichier
    (circuits.json : 790 circuits, fetch 2026-05-28 ; races.json : 3307 courses
    2026-03-18→2026-05-31, scrape 2026-03-19, `spots_total` absent ;
    fichiers `*.test.json` : artefacts de test des scripts, non utilisés par le site).
- **Vérification** : vérif standard.
- **Critère** : les deux README existent et mentionnent le blocage captcha et la
  variable `NEXT_PUBLIC_REFERENCE_DATE`.
- **Dépendances** : 0.1.

#### Étape 0.4 — Repo GitHub + Vercel (décision Antoine 2026-07-07 : brancher maintenant)

- **Fichiers** : aucun fichier de code ; actions GitHub/Vercel.
- **Contenu** :
  1. Créer le repo GitHub **public** `karthopper` (via `gh repo create karthopper
     --public --source . --remote origin` ; si `gh` n'est pas authentifié :
     **STOP et demander à Antoine de lancer `gh auth login`**).
  2. `git push -u origin main` (les commits 0.1→0.3 uniquement).
  3. **Actions manuelles d'Antoine** (l'exécutant les liste et s'arrête le temps
     qu'elles soient faites) : importer le repo dans Vercel (framework Next.js,
     réglages par défaut) ; définir dans Vercel → Settings → Environment Variables :
     `NEXT_PUBLIC_MAPTILER_API_KEY` (la clé créée, voir guide MapTiler) et
     `NEXT_PUBLIC_REFERENCE_DATE=2026-04-01` (à retirer quand le pipeline données
     sera réparé). **Ne pas brancher les domaines karthopper.com/.fr pour
     l'instant** : gate = mentions légales complétées (voir 6.3) + données
     fraîches ; l'URL `*.vercel.app` suffit pendant le développement.
- **Vérification** : `git remote -v` montre origin ; le déploiement Vercel du
  commit `V1 L0.3` est vert et `/fr` s'affiche sur l'URL `*.vercel.app`.
- **Critère** : landing accessible en ligne sur l'URL Vercel, dans les 2 locales.
- **Dépendances** : 0.1–0.3, clé MapTiler créée par Antoine.

---

### Lot 1 — Socle données & utilitaires

#### Étape 1.1 — Date de référence

- **Fichiers** : créer `src/lib/reference-date.ts`.
- **Contenu** :
  ```ts
  /** Date "aujourd'hui" pilotable pour la recette sur seed périmé (voir PLAN_V1 D2). */
  export function getReferenceDate(): string {
    const override = process.env.NEXT_PUBLIC_REFERENCE_DATE;
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
    return new Date().toISOString().slice(0, 10);
  }
  ```
- **Vérification** : vérif standard.
- **Critère** : la fonction existe, typée `(): string`, build vert.
- **Dépendances** : 0.2.

#### Étape 1.2 — Chargement serveur des données (SSG)

- **Fichiers** : créer `src/lib/data.ts`.
- **Contenu** (lecture fs pour les pages SSG et le sitemap — jamais importé côté client) :
  ```ts
  import { readFileSync } from "node:fs";
  import { resolve } from "node:path";
  import type { Circuit } from "@/types/circuit";
  import type { Race } from "@/types/race";

  const DATA_DIR = resolve(process.cwd(), "public/data");

  export function loadCircuits(): Circuit[] { /* JSON.parse(readFileSync(...circuits.json)) */ }
  export function loadRaces(): Race[] { /* idem races.json */ }
  export function findCircuitBySlug(slug: string): Circuit | undefined { /* sur loadCircuits() */ }
  ```
  Implémenter les corps exactement comme décrit (pas de cache maison : Next
  mémoïse au build).
- **Vérification** : vérif standard.
- **Critère** : `loadCircuits().length === 790` (vérifiable via
  `npx tsx -e "import{loadCircuits}from'./src/lib/data';console.log(loadCircuits().length)"`).
- **Dépendances** : 1.1.

#### Étape 1.3 — Géo : haversine

- **Fichiers** : créer `src/lib/geo.ts`.
- **Contenu** :
  ```ts
  export interface LatLng { lat: number; lng: number }

  /** Distance à vol d'oiseau en km (rayon terrestre 6371 km). */
  export function haversineKm(a: LatLng, b: LatLng): number
  ```
  Formule standard (sin²(Δφ/2) + cosφ1·cosφ2·sin²(Δλ/2)), retour arrondi à 1 km
  près (`Math.round`).
- **Vérification** : vérif standard + test ponctuel :
  Paris (48.8566, 2.3522) → Lyon (45.7640, 4.8357) doit donner 391 ± 5 km.
- **Critère** : le test Paris–Lyon tombe dans [386, 396].
- **Dépendances** : aucune (parallélisable avec 1.2).

#### Étape 1.4 — Helpers courses + filtrage pur

- **Fichiers** : créer `src/lib/races.ts`.
- **Contenu** :
  ```ts
  import type { Race } from "@/types/race";
  import type { Circuit } from "@/types/circuit";
  import { haversineKm, type LatLng } from "@/lib/geo";

  export interface RaceFilters {
    origin: (LatLng & { label: string }) | null;
    radiusKm: number;            // 2000 = illimité
    dateFrom: string;            // ISO YYYY-MM-DD inclus
    dateTo: string | null;       // ISO inclus, null = sans borne
    categories: RaceCategory[];  // [] = toutes
  }

  export function upcomingRaces(races: Race[], referenceDate: string): Race[]
  // date >= referenceDate, tri date croissante puis title

  export function racesByCircuitId(races: Race[]): Map<number, Race[]>

  export function circuitById(circuits: Circuit[]): Map<number, Circuit>

  export function applyFilters(
    races: Race[],
    circuits: Map<number, Circuit>,
    filters: RaceFilters
  ): Race[]
  // 1) date dans [dateFrom, dateTo] ; 2) si origin non null et radiusKm < 2000 :
  //    distance haversine(origin, circuit du race) <= radiusKm ;
  //    une course dont circuit_id est inconnu est EXCLUE dès qu'un filtre distance est actif ;
  // 3) categories vide OU categories.includes(race.category).

  export function distanceToCircuit(
    origin: LatLng | null, circuit: Circuit | undefined
  ): number | null
  ```
- **Vérification** : vérif standard + `npx tsx -e` : avec
  `referenceDate="2026-04-01"`, `upcomingRaces(loadRaces(), "2026-04-01").length`
  doit être > 1500 et la première course datée `2026-04-01`.
- **Critère** : les deux assertions ci-dessus vraies.
- **Dépendances** : 1.2, 1.3.

#### Étape 1.5 — `validate-data.ts` : date de référence

- **Fichiers** : modifier `scripts/validate-data.ts` (uniquement).
- **Contenu** : remplacer les deux occurrences de
  `new Date().toISOString().slice(0, 10)` par la lecture d'un argument
  `--reference-date=YYYY-MM-DD` (via le `readArgValue` existant) avec fallback
  `process.env.KH_REFERENCE_DATE` puis date du jour. Afficher la date utilisée
  dans le rapport.
- **Vérification** :
  `npx tsx scripts/validate-data.ts --reference-date=2026-04-01` → exit 0 ;
  `npx tsx scripts/validate-data.ts` → exit 1 avec `Error: No future races found`
  (comportement honnête sur seed périmé). Vérif standard.
- **Critère** : les deux exit codes ci-dessus exacts.
- **Dépendances** : 0.1.

---

### Lot 2 — Page carte

#### Étape 2.1 — Store de filtres + position (Zustand)

- **Fichiers** : créer `src/store/filters.ts`.
- **Contenu** :
  ```ts
  import { create } from "zustand";
  import { persist } from "zustand/middleware";
  import type { LatLng } from "@/lib/geo";

  export interface Origin extends LatLng { label: string }

  interface FiltersStore {
    origin: Origin | null;
    radiusKm: number;                 // défaut 2000 (= illimité)
    dateFrom: string | null;          // null = date de référence (défaut)
    dateTo: string | null;
    categories: RaceCategory[];       // défaut [] = toutes
    selectedCircuitId: number | null; // circuit sélectionné (popup / focus liste)
    setOrigin(origin: Origin | null): void;
    setRadiusKm(km: number): void;
    setDateRange(from: string | null, to: string | null): void;
    toggleCategory(category: RaceCategory): void;
    setSelectedCircuitId(id: number | null): void;
    resetFilters(): void;             // remet radius/dates/categories, conserve origin
    hydrateFromUrl(partial: Partial<Pick<FiltersStore, "origin" | "radiusKm" | "dateFrom" | "dateTo" | "categories">>): void;
  }

  export const useFiltersStore = create<FiltersStore>()(
    persist(/* ... */, { name: "karthopper.filters.v1", partialize: (s) => ({ origin: s.origin }) })
  );
  ```
  Seule `origin` est persistée (cahier des charges F5 : adresse sauvegardée en
  localStorage). Valeurs de rayon autorisées : `[50, 100, 200, 500, 1000, 2000]`.
- **Vérification** : vérif standard.
- **Critère** : build vert ; le fichier n'exporte que le store et le type `Origin`.
- **Dépendances** : 1.3.

#### Étape 2.2 — Hook données client

- **Fichiers** : créer `src/hooks/use-karthopper-data.ts`.
- **Contenu** :
  ```ts
  "use client" n'est PAS nécessaire dans un hook — le fichier reste un module simple.

  export interface KarthopperData {
    circuits: Circuit[] | null;
    races: Race[] | null;      // TOUTES les courses du seed (le filtrage se fait ailleurs)
    loading: boolean;
    error: boolean;
    retry(): void;
  }
  export function useKarthopperData(): KarthopperData
  ```
  Implémentation : `useEffect` + `fetch("/data/circuits.json")` et
  `fetch("/data/races.json")` en parallèle (`Promise.all`), état local, `retry`
  ré-exécute. Aucune lib de fetching.
- **Vérification** : vérif standard.
- **Critère** : build vert, le hook ne référence ni `fs` ni `@/lib/data`.
- **Dépendances** : 1.2 (types), 1.4.

#### Étape 2.3 — Géolocalisation + saisie ville (Photon)

- **Fichiers** : créer `src/components/map/OriginPicker.tsx`.
- **Contenu** : composant client (named export `OriginPicker`, sans props) qui :
  1. Bouton « Ma position » (icône Lucide `LocateFixed`) →
     `navigator.geolocation.getCurrentPosition` ; succès →
     `setOrigin({lat, lng, label: t("filters.myPosition")})` ; échec → message
     inline `text-sm text-slate-500`.
  2. Champ texte ville (placeholder `t("filters.cityPlaceholder")`) ; à partir de
     3 caractères, débounce 300 ms, `fetch("https://photon.komoot.io/api/?q=" +
     encodeURIComponent(q) + "&limit=5&lang=" + (locale === "fr" ? "fr" : "en"))` ;
     afficher les 5 suggestions (`properties.name + ", " + properties.country`) dans
     une liste ; clic → `setOrigin({lat: coords[1], lng: coords[0], label})`.
  3. Si `origin` définie : afficher son label + bouton effacer (icône `X`).
  - Classes : champ `rounded-lg border border-slate-200 px-3 py-2 text-sm
    focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2` ;
    suggestions `bg-white shadow-panel rounded-lg` ; liste avec rôles
    `role="listbox"` / `role="option"`, navigation flèches + Entrée.
- **Vérification** : vérif standard ; en dev : taper « Clermont » → ≥ 1 suggestion ;
  la sélectionner → le label s'affiche.
- **Critère** : la sélection d'une suggestion Photon remplit `origin` (visible via
  le label affiché) sans erreur console.
- **Dépendances** : 2.1.

#### Étape 2.4 — MapView (MapLibre + clustering)

- **Fichiers** : créer `src/components/map/MapView.tsx`.
- **Contenu** : composant client `MapView`, props :
  ```ts
  interface MapViewProps {
    circuits: Circuit[];
    upcomingCountByCircuit: Map<number, number>;
    visitedIds?: ReadonlySet<number>;      // utilisé au Lot 5, optionnel dès maintenant
    passportMode?: boolean;                // idem, défaut false
    onSelectCircuit(id: number | null): void;
    selectedCircuitId: number | null;
    children?: React.ReactNode;            // slot popup
  }
  ```
  - `Map` de `react-map-gl/maplibre`, `mapStyle=
    "https://api.maptiler.com/maps/positron/style.json?key=" + apiKey` où
    `apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY`. **Si la clé est
    `undefined` : rendre à la place un panneau d'erreur** (fond `bg-slate-50`,
    icône `AlertTriangle` 48 px, texte `t("map.missingKey")`) — et le signaler.
  - Vue initiale : centre `{lng: 4.85, lat: 46.6}` (France/Europe), zoom 5.
    Si `origin` définie (lue via le store) : centrer dessus, zoom 7.
  - Source GeoJSON `circuits` : 1 feature Point par circuit, `properties:
    { id, name, upcoming, visited }` ; `cluster: true`, `clusterRadius: 50`,
    `clusterMaxZoom: 11`.
  - Layers (couleurs DA §5) :
    1. `clusters` (circle) : `circle-color #1E293B`, `circle-radius` step
       `[16, 10, 20, 50, 26]`, `circle-stroke-width 2`, `circle-stroke-color #FFFFFF`.
    2. `cluster-count` (symbol) : `text-field {point_count_abbreviated}`,
       `text-size 12`, `text-color #FFFFFF`.
    3. `circuit-point` (circle) : `circle-radius` : 14 si sélectionné sinon 12 ;
       `circle-color` par expression :
       mode normal → `upcoming > 0 ? #FF5A1F : #94A3B8` ;
       mode passeport → `visited ? #FF5A1F : #CBD5E1` ;
       `circle-stroke-width` : 4 si sélectionné sinon 2, stroke `#FFFFFF`.
    4. `circuit-count` (symbol) : `text-field upcoming` (masqué si 0 ou si mode
       passeport), `text-size 11`, `text-color #FFFFFF`.
  - `interactiveLayerIds=["clusters","circuit-point"]` ; clic cluster → `easeTo`
    zoom+2 sur le cluster ; clic point → `onSelectCircuit(id)` ; clic vide →
    `onSelectCircuit(null)`. Curseur `pointer` au survol des deux layers.
  - Si `origin` définie : `Marker` bleu (`#2563EB`, cercle 12 px bordure blanche)
    à sa position.
- **Vérification** : vérif standard (le composant n'est pas encore monté — OK).
- **Critère** : build vert, aucune couleur hors palette DA dans le fichier.
- **Dépendances** : 2.1, 2.2.

#### Étape 2.5 — Popup circuit

- **Fichiers** : créer `src/components/map/CircuitPopup.tsx`.
- **Contenu** : composant client `CircuitPopup`, props :
  ```ts
  interface CircuitPopupProps {
    circuit: Circuit;
    upcoming: Race[];         // déjà filtrées/triées, ce composant en affiche max 3
    locale: string;
    onClose(): void;
  }
  ```
  Rend un `<Popup>` de `react-map-gl/maplibre` (anchor `bottom`, `closeButton false`,
  offset 16) contenant (DA §5 « Popup ») :
  - Nom : `font-heading font-semibold text-base text-slate-900`.
  - `MapPin` 14 px + `{city}, {country}` : `text-sm text-slate-500`.
  - `t("map.upcomingCount", {count})` (`Flag` Lucide 14 px).
  - Jusqu'à 3 courses : `Badge` variant = `race.category` (mapper `other → special`),
    date courte via `Intl.DateTimeFormat(locale, {day:"numeric", month:"short"})`,
    prix via `Intl.NumberFormat(locale, {style:"currency", currency: race.currency})`
    si `price !== null` ; ligne `text-sm`, chiffres `tabular-nums`.
  - Si 0 course : `t("map.noUpcoming")` en `text-sm text-slate-400`.
  - Lien `t("map.viewCircuit")` → `Link` (de `@/i18n/navigation`) vers
    `/circuit/${circuit.slug}`, classes `text-sm font-medium text-kart-700
    hover:underline focus-visible:ring-2 focus-visible:ring-kart-500`.
  - Bouton fermer : icône `X` 16 px, `aria-label={t("common.close")}`.
- **Vérification** : vérif standard.
- **Critère** : build vert ; le prix utilise `race.currency` (pas de « € » codé en dur).
- **Dépendances** : 2.4.

#### Étape 2.6 — Page `/map` (assemblage desktop minimal)

- **Fichiers** : créer `src/app/[locale]/map/page.tsx`,
  `src/components/map/MapScreen.tsx` ; modifier `src/messages/fr.json`,
  `src/messages/en.json`.
- **Contenu** :
  - `page.tsx` : Server Component. `generateMetadata` avec titre
    FR « Carte des circuits et courses SWS — KartHopper » / EN équivalent
    (via messages `map.metaTitle`, `map.metaDescription`). Rend `<MapScreen />`.
    Le layout parent affiche déjà Header/Footer ; la page utilise
    `h-[calc(100dvh-3.5rem)]` (56 px = header) sans footer visible au-dessus du
    pli : envelopper dans `<div className="flex h-[calc(100dvh-3.5rem)]">`.
  - `MapScreen.tsx` : composant client qui orchestre :
    `useKarthopperData()` ; états chargement (skeleton : `div` plein écran
    `animate-pulse bg-slate-100`, respecter `motion-reduce:animate-none`) et
    erreur (composant d'état vide de l'étape 3.4 — en attendant, texte simple
    `common.error` + bouton `common.retry`) ; calcule
    `upcoming = upcomingRaces(races, getReferenceDate())`,
    `upcomingCountByCircuit`, circuit sélectionné → `<CircuitPopup>`.
    Desktop : `<aside className="hidden lg:flex w-[380px] shrink-0 flex-col
    border-r border-slate-200 bg-slate-50">` (contenu réel au Lot 3 ; provisoirement
    `OriginPicker` + compteur `t("filters.results", {count})`) + carte `flex-1`.
  - Messages à ajouter (fr + en) : `map.metaTitle`, `map.metaDescription`,
    `map.missingKey`, `map.upcomingCount` (« {count} courses à venir »),
    `map.noUpcoming`, `map.viewCircuit`, `filters.myPosition`,
    `filters.cityPlaceholder`, `common.close`.
- **Vérification** : vérif standard ; en dev (`.env.local` avec clé MapTiler +
  `NEXT_PUBLIC_REFERENCE_DATE=2026-04-01`) : ouvrir `/fr/map` → la carte Positron
  s'affiche, des clusters slate apparaissent sur l'Europe ; zoomer sur la France →
  marqueurs individuels orange (avec compteur) et gris ; cliquer un marqueur
  orange → popup avec ≤ 3 courses datées d'avril/mai 2026 + prix ; cliquer
  « Voir le circuit » → 404 attendue (page créée au Lot 4) — ne pas corriger.
- **Critère** : sur `/fr/map`, un clic sur un marqueur orange ouvre une popup
  affichant nom + ville + au moins 1 course avec prix formaté.
- **Dépendances** : 2.2, 2.3, 2.4, 2.5, et clé MapTiler dans `.env.local`
  (**si absente : STOP**).

---

### Lot 3 — Liste des courses + filtres

#### Étape 3.1 — RaceCard

- **Fichiers** : créer `src/components/races/RaceCard.tsx` ; messages :
  ajouter `race.viewOnSws` n'existe pas → utiliser `race.registerOnSws` (existant).
- **Contenu** : composant `RaceCard`, props :
  ```ts
  interface RaceCardProps {
    race: Race;
    circuit: Circuit | undefined;
    distanceKm: number | null;
    locale: string;
    selected: boolean;
    onSelect(): void;   // focus carte sur le circuit
  }
  ```
  Structure (DA §6 « RaceCard », sans jauge de places — `spots_total` absent du seed) :
  - Conteneur : `<article>` cliquable (`onSelect` au clic, `tabIndex 0`, Entrée =
    clic), classes `bg-white rounded-lg shadow-card hover:shadow-card-hover
    transition-shadow motion-reduce:transition-none p-4 cursor-pointer
    focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2`
    + `ring-2 ring-kart-500` si `selected`.
  - Ligne 1 : `Badge` catégorie (`other → special`) + titre `font-heading
    font-medium text-base text-slate-900 line-clamp-2`.
  - Ligne 2 : `{circuit?.name} · {circuit?.city}, {circuit?.country}` en
    `text-sm text-slate-500` (si circuit undefined : `race.slug`).
  - Ligne 3 (grid 2 col, `text-sm text-slate-700`, icônes Lucide 14 px) :
    `Calendar` + date longue (`Intl.DateTimeFormat(locale, {day:"numeric",
    month:"long", year:"numeric"})`) ; `Car` + `race.kart_model` si non null ;
    `MapPin` + `{distanceKm} km` (`tabular-nums`) si non null.
  - Ligne 4 : prix `Intl.NumberFormat(locale, {style:"currency",
    currency: race.currency})` en `text-lg font-semibold text-slate-900
    tabular-nums` (si `price null` : ne rien afficher) ; à droite, lien
    `t("race.registerOnSws")` → `race.sws_url`, `target="_blank"
    rel="noopener noreferrer"`, classes ghost DA `text-sm font-medium text-kart-700
    hover:bg-kart-50 rounded-lg px-2 py-1 focus-visible:ring-2
    focus-visible:ring-kart-500` — `onClick` avec `stopPropagation`.
  - Badges d'état (DA §12) : si `race.deadline` non null, parsable en date et
    < 48 h après la date de référence → `Badge variant="full"` texte
    `t("race.closesTomorrow")` ; entre 2 et 7 jours → `Badge variant="almost-full"`
    `t("race.closesInDays", {count})`. (Pas de badge places : données absentes.)
- **Vérification** : vérif standard.
- **Critère** : build vert ; aucun symbole monétaire ni format de date codé en dur.
- **Dépendances** : 1.4.

#### Étape 3.2 — Barre de filtres

- **Fichiers** : créer `src/components/races/RaceFilters.tsx` ; messages fr/en.
- **Contenu** : composant client `RaceFilters` (sans props, lit le store) :
  - `OriginPicker` (réutilisé).
  - **Rayon** : `<select>` natif stylé (`rounded-lg border border-slate-200
    px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-kart-500`) avec
    options `50 / 100 / 200 / 500 / 1000 km / t("filters.noLimit")` (=2000),
    label `t("filters.distance")`, désactivé (`disabled` + `opacity-50`) tant que
    `origin === null`, avec hint `t("filters.needOrigin")`.
  - **Période** : deux `<input type="date">` (mêmes classes), labels
    `t("filters.dateFrom")` / `t("filters.dateTo")` ; valeurs par défaut :
    from = date de référence, to = vide. `min` de `dateTo` = `dateFrom`.
  - **Catégories** : 4 chips-boutons toggle (`Sprint`, `Endurance`, `Junior`,
    `t("categories.other")`), libellés via messages `categories.*` (existants).
    Forme pilule (`rounded-full px-2.5 py-1 text-xs font-medium border
    focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2`),
    `aria-pressed` ; inactif : `bg-white border-slate-200 text-slate-600` ;
    actif (couleurs Badge DA par catégorie) : sprint `bg-kart-50 text-kart-700
    border-kart-500`, endurance `bg-blue-100 text-blue-700 border-blue-600`,
    junior `bg-green-100 text-green-700 border-green-600`, other
    `bg-violet-100 text-violet-700 border-violet-600`. Clic →
    `toggleCategory(...)`. Groupe précédé d'un `<span>` label
    `t("filters.category")` (message existant), rôle `group` +
    `aria-labelledby`.
  - Bouton `t("filters.reset")` (style secondary DA : `bg-white border
    border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-3 py-2 text-sm
    focus-visible:ring-2 focus-visible:ring-slate-400`) → `resetFilters()`.
  - Compteur résultats `t("filters.results", {count})` en `text-sm font-medium
    text-slate-700 tabular-nums` — le count est passé en prop :
    `interface RaceFiltersProps { resultCount: number }` (seule prop).
  - Tous les labels via `<label htmlFor>` reliés.
  - Messages à ajouter : `filters.noLimit`, `filters.needOrigin`,
    `filters.dateFrom`, `filters.dateTo`.
- **Vérification** : vérif standard.
- **Critère** : chaque contrôle a un `<label>` relié (vérifiable dans le DOM).
- **Dépendances** : 2.1, 2.3.

#### Étape 3.3 — RaceList + intégration MapScreen

- **Fichiers** : créer `src/components/races/RaceList.tsx` ; modifier
  `src/components/map/MapScreen.tsx`.
- **Contenu** :
  - `RaceList` props :
    ```ts
    interface RaceListProps {
      races: Race[];                       // déjà filtrées + triées
      circuits: Map<number, Circuit>;
      origin: LatLng | null;
      locale: string;
      selectedCircuitId: number | null;
      onSelectCircuit(id: number): void;
    }
    ```
    Rend `<ul>` de `RaceCard` (li key = race.id). **Rendu plafonné à 100 courses**
    + s'il y en a plus : bouton `t("filters.showMore", {count})` qui ajoute 100
    (état local). Pas de virtualisation (pas de dépendance).
  - `MapScreen` : brancher le vrai pipeline :
    `const filtered = applyFilters(upcoming, circuitMap, {origin, radiusKm,
    dateFrom: dateFrom ?? referenceDate, dateTo})` ; l'aside desktop devient :
    `RaceFilters` (sticky top, `border-b border-slate-200 bg-slate-50 p-4`) +
    `RaceList` scrollable (`flex-1 overflow-y-auto p-4 flex flex-col gap-3`).
    Sélection croisée : clic `RaceCard` → `setSelectedCircuitId` + la carte
    `easeTo` le circuit (zoom 10) ; clic marqueur → popup (comportement Lot 2
    conservé) et la liste scrolle jusqu'à la première course de ce circuit
    (`scrollIntoView({block:"nearest"})`, `behavior:"smooth"` sauf
    `prefers-reduced-motion`).
  - Message : `filters.showMore` (« Afficher {count} de plus »).
- **Vérification** : vérif standard ; en dev : `/fr/map`, définir origine
  « Clermont-Ferrand », rayon 200 km → le compteur chute, toutes les cartes
  affichent une distance ≤ 200 km ; réduire la période à 1 semaine → le compteur
  chute encore ; cliquer une carte → la carte de droite se centre sur le circuit.
- **Critère** : avec origine Clermont-Ferrand + rayon 200 km +
  `NEXT_PUBLIC_REFERENCE_DATE=2026-04-01`, la liste est non vide et aucune
  `RaceCard` n'affiche une distance > 200 km.
- **Dépendances** : 3.1, 3.2, 2.6.

#### Étape 3.4 — États vides

- **Fichiers** : créer `src/components/EmptyState.tsx` ; modifier `MapScreen.tsx` ;
  messages fr/en.
- **Contenu** :
  - `EmptyState` props :
    ```ts
    interface EmptyStateProps {
      icon: LucideIcon;          // import type { LucideIcon } from "lucide-react"
      title: string;
      description: string;
      action?: { label: string; onClick(): void };
    }
    ```
    Rendu (DA §8) : centré, icône 48 px `text-slate-400`, titre `font-heading
    font-semibold text-slate-900`, description `text-sm text-slate-500
    max-w-[240px] text-center`, bouton action style secondary (cf. 3.2).
  - Brancher dans `MapScreen` : liste vide → `SearchX` +
    `t("filters.noResults")` + `t("filters.noResultsHint")` + action reset ;
    erreur de chargement → `AlertTriangle` + `t("common.error")` +
    `t("emptyStates.loadErrorHint")` + action retry ; pas d'origine définie
    (et liste non vide) → bandeau discret en haut de liste (pas un EmptyState) :
    `t("emptyStates.noOriginHint")` en `text-sm text-slate-500`.
  - Messages : `filters.noResultsHint`, `emptyStates.loadErrorHint`,
    `emptyStates.noOriginHint`.
- **Vérification** : vérif standard ; en dev : mettre rayon 50 km autour d'un
  point en mer (taper « Ajaccio », rayon 50) → état vide avec bouton reset
  fonctionnel.
- **Critère** : filtres impossibles → `SearchX` visible + le bouton reset ramène
  des résultats.
- **Dépendances** : 3.3.

#### Étape 3.5 — Responsive mobile (bottom sheet 3 états)

- **Fichiers** : créer `src/components/map/BottomSheet.tsx` ; modifier `MapScreen.tsx`.
- **Contenu** :
  - `BottomSheet` props :
    ```ts
    type SheetState = "peek" | "half" | "full";
    interface BottomSheetProps {
      state: SheetState;
      onStateChange(state: SheetState): void;
      peekContent: React.ReactNode;   // compteur + résumé filtres actifs
      children: React.ReactNode;      // filtres + liste
    }
    ```
    Rendu : `<section>` fixé en bas (`fixed inset-x-0 bottom-0 z-40 lg:hidden`),
    `bg-white rounded-t-2xl shadow-panel`, hauteur `25dvh / 50dvh / 90dvh` selon
    l'état, `transition-[height] duration-300 ease-out motion-reduce:transition-none`.
    Poignée : `<button>` pleine largeur avec barre `mx-auto my-2 h-1.5 w-10
    rounded-full bg-slate-300`, `aria-label={t("map.sheetToggle")}` ; clic =
    cycle peek → half → full → peek. Deux boutons chevron (`ChevronUp`/`ChevronDown`,
    `aria-label` dédiés) pour monter/descendre d'un état. En `peek` : seul
    `peekContent` ; en `half`/`full` : `children` scrollable.
  - `MapScreen` : sous `lg`, l'aside est caché (déjà le cas) ; monter
    `<BottomSheet>` avec peekContent = compteur résultats + label origine, et
    children = `RaceFilters` + `RaceList`. La carte reste plein écran derrière.
    Bouton flottant « recentrer » (`Locate` Lucide, cercle blanc `shadow-card`,
    48 px, en bas à droite au-dessus de la sheet) → recentre sur `origin` si définie.
  - Messages : `map.sheetToggle`, `map.recenter`, `map.sheetUp`, `map.sheetDown`.
- **Vérification** : vérif standard ; en dev, viewport 390 px (devtools) : la
  sheet démarre en peek, le cycle des 3 états fonctionne, la liste scrolle en
  half/full, la carte reste interactive en peek.
- **Critère** : à 390 px de large, les 3 états s'enchaînent au clic et la liste
  est scrollable en état full.
- **Dépendances** : 3.3, 3.4.

#### Étape 3.6 — Filtres partageables par URL + bouton Partager

- **Fichiers** : créer `src/components/map/UrlFiltersSync.tsx` ; modifier
  `src/components/map/MapScreen.tsx`, `src/app/[locale]/map/page.tsx`,
  `src/components/races/RaceFilters.tsx` ; messages fr/en.
- **Contenu** :
  - **Format des query params** (tous optionnels) : `lat`, `lng` (nombres, 4
    décimales max), `loc` (label origine, URL-encodé), `r` (rayon, une des
    valeurs autorisées), `from`, `to` (`YYYY-MM-DD`), `cat` (catégories en CSV,
    ex. `sprint,endurance`).
  - `UrlFiltersSync` : composant client **sans rendu** (`return null`) monté
    dans `MapScreen` :
    1. Au mount : lire `useSearchParams()`, valider chaque param (nombre fini,
       date au format, rayon dans la liste, catégories dans l'union) —
       **ignorer silencieusement tout param invalide** — puis un unique appel
       `hydrateFromUrl(...)`.
    2. Ensuite : à chaque changement des 5 valeurs du store (useEffect,
       debounce 300 ms), reconstruire la query string (omettre les valeurs par
       défaut : rayon 2000, dates par défaut, catégories vides) et
       `window.history.replaceState(null, "", pathname + qs)` — **pas**
       `router.replace` (évite un re-render RSC).
  - `page.tsx` : envelopper `<MapScreen />` dans `<Suspense fallback={null}>`
    (requis par `useSearchParams` en App Router).
  - Bouton **Partager** dans `RaceFilters` (sous le compteur) : icône Lucide
    `Share2` 14 px + `t("filters.share")`, style secondary (cf. 3.2) ; clic →
    `navigator.clipboard.writeText(window.location.href)` puis feedback inline
    `t("filters.linkCopied")` en `text-green-700 text-xs` pendant 2 s
    (`aria-live="polite"`).
  - Messages : `filters.share` (« Partager ces filtres »/« Share these
    filters »), `filters.linkCopied` (« Lien copié ! »/« Link copied! »).
- **Vérification** : vérif standard ; en dev : régler origine Clermont-Ferrand +
  rayon 200 + catégorie sprint → l'URL se met à jour ; copier l'URL, l'ouvrir
  dans une fenêtre de navigation privée → les mêmes filtres et le même compteur
  s'affichent.
- **Critère** : une URL avec `?lat=45.7772&lng=3.087&loc=Clermont-Ferrand&r=200&cat=sprint`
  ouverte dans un navigateur vierge reproduit exactement le compteur de
  résultats de la session d'origine.
- **Dépendances** : 3.2, 3.3.

#### Étape 3.7 — Export agenda .ics par course

- **Fichiers** : créer `src/lib/ics.ts` ; modifier
  `src/components/races/RaceCard.tsx` ; messages fr/en.
- **Contenu** :
  - `src/lib/ics.ts` :
    ```ts
    /** Génère un VCALENDAR (RFC 5545) pour une course — événement journée entière. */
    export function buildRaceIcs(race: Race, circuit: Circuit | undefined): string
    ```
    Contenu : `BEGIN:VCALENDAR`, `VERSION:2.0`,
    `PRODID:-//KartHopper//karthopper.com//EN`, un `VEVENT` avec :
    `UID:race-{race.id}@karthopper.com`, `DTSTAMP` (date de référence au format
    `YYYYMMDDT000000Z`), `DTSTART;VALUE=DATE:` date de course sans tirets
    (événement journée entière — l'heure de départ n'est pas dans les données),
    `SUMMARY:` `{race.title} ({circuit.name})`, `LOCATION:`
    `{circuit.name}, {circuit.city}, {circuit.country}` si circuit défini,
    `GEO:{lat};{lng}`, `DESCRIPTION:` catégorie + prix formaté + lien SWS,
    `URL:` `race.sws_url`, `END:VEVENT`, `END:VCALENDAR`.
    Échapper `,` `;` `\` et remplacer les sauts de ligne par `\n` littéral dans
    SUMMARY/LOCATION/DESCRIPTION ; fins de ligne `\r\n` ; aucune ligne > 74
    caractères (tronquer DESCRIPTION à 150 caractères, pas de pliage RFC).
  - `RaceCard` : à côté du lien SWS, bouton icône `CalendarPlus` 16 px
    (`aria-label={t("race.addToCalendar")}`, `title` idem, classes ghost cf. DA,
    `stopPropagation`) → `new Blob([buildRaceIcs(race, circuit)],
    {type: "text/calendar;charset=utf-8"})` téléchargé sous
    `karthopper-{race.id}.ics` (créer/cliquer/révoquer l'ObjectURL).
  - Message : `race.addToCalendar` (« Ajouter à mon agenda »/« Add to my calendar »).
- **Vérification** : vérif standard ; en dev : télécharger un .ics et l'ouvrir
  dans le calendrier Windows ou l'importer dans Google Calendar → l'événement
  apparaît au bon jour avec le bon titre et le lien SWS dans la description.
- **Critère** : le fichier téléchargé s'importe sans erreur dans Google Calendar
  et l'événement tombe sur la date exacte de la course.
- **Dépendances** : 3.1.

---

### Lot 4 — Fiche circuit

#### Étape 4.1 — Page SSG `/circuit/[slug]`

- **Fichiers** : créer `src/app/[locale]/circuit/[slug]/page.tsx`,
  `src/components/circuit/CircuitPhoto.tsx` ; messages fr/en.
- **Contenu** :
  - `generateStaticParams` : `loadCircuits().map(c => ({ slug: c.slug }))`
    (next-intl génère le produit avec les locales) ; `export const dynamicParams
    = false` ; slug inconnu → `notFound()`.
  - `generateMetadata` : title `` `${name} — Karting ${city}, ${country} |
    KartHopper` `` ; description via message `circuit.metaDescription`
    (« Circuit de karting {name} à {city}, {country}. Prochaines courses Sodi
    World Series, infos et accès. » + EN).
  - Corps (Server Component, données via `loadCircuits`/`loadRaces` +
    `upcomingRaces(..., getReferenceDate())` filtrées sur `circuit_id`) :
    1. Fil d'ariane : lien `t("nav.map")` → `/map`.
    2. `<h1>` nom (`font-heading text-3xl font-bold text-slate-900`) ;
       sous-titre `{city}, {country}` + `Badge` `indoor`/`outdoor` si un des
       races du circuit a `track_type` non null (prendre le premier non null).
    3. `CircuitPhoto` (composant client) : `<img src={photo_url}
       alt={t("circuit.photoAlt", {name})} loading="lazy" className="w-full
       max-w-2xl rounded-lg object-cover aspect-video bg-slate-100">` avec
       `onError` → remplace par un placeholder `bg-slate-100` + icône `ImageOff`
       centrée (état local).
    4. Bloc infos (`dl` 2 colonnes, `text-sm`) : adresse, téléphone (lien `tel:`),
       site web (lien externe `rel="noopener noreferrer"`), lien
       `t("circuit.viewOnSws")` → `circuit.sws_url` (classes lien kart-700).
    5. Section `<h2>{t("circuit.upcomingTitle")}</h2>` : liste de `RaceCard`
       (sans `distanceKm` ni sélection : `distanceKm null`, `selected false`,
       `onSelect` = no-op ; passer `locale`). Si aucune : `EmptyState` `SearchX`
       + `t("circuit.noUpcoming")` sans action.
    6. JSON-LD `<script type="application/ld+json">` : `@type:
       "SportsActivityLocation"`, name, address (`streetAddress`, `addressLocality`,
       `addressCountry` = `country_iso.toUpperCase()`), geo (lat/lng), url SWS.
  - **Note RaceCard** : `RaceCard` est un composant client — l'utiliser depuis un
    Server Component est permis (props sérialisables) ; remplacer la prop
    `onSelect` par `onSelect?: () => void` optionnelle dans `RaceCard`
    (modification autorisée de `RaceCard.tsx` à cette étape) et ne pas la passer ici.
  - Messages : `circuit.metaDescription`, `circuit.photoAlt`, `circuit.viewOnSws`,
    `circuit.upcomingTitle`, `circuit.noUpcoming`, `circuit.address`,
    `circuit.phone`, `circuit.website`.
- **Vérification** : vérif standard — **attention** : le build va générer
  ~1580 pages, vérifier qu'il reste < 5 min ; en dev : depuis `/fr/map`, cliquer
  « Voir le circuit » dans une popup → la fiche s'ouvre, photo ou placeholder,
  courses listées.
- **Critère** : `npm run build` liste la route `/[locale]/circuit/[slug]` en ●
  (SSG) et `/fr/circuit/<slug inexistant>` rend une 404.
- **Dépendances** : 1.2, 1.4, 3.1, 3.4.

---

### Lot 5 — Passeport karthopping (localStorage, sans compte)

#### Étape 5.1 — Store passeport versionné

- **Fichiers** : créer `src/store/passport.ts`, `src/types/passport.ts`.
- **Contenu** :
  - `src/types/passport.ts` :
    ```ts
    /** Format d'échange du passeport (export/import + future migration compte V2). */
    export interface PassportExport {
      schema_version: 1;
      exported_at: string;                 // ISO datetime
      visits: { circuit_id: number; marked_at: string }[];
    }
    ```
  - `src/store/passport.ts` : store zustand persisté
    (`name: "karthopper.passport.v1"`, `version: 1`) :
    ```ts
    interface PassportStore {
      visits: Record<number, string>;      // circuit_id -> marked_at ISO
      toggleVisit(circuitId: number): void;
      isVisited(circuitId: number): boolean;
      toExport(): PassportExport;
      importFrom(data: unknown): boolean;  // valide schema_version===1 et la forme ; merge (union) ; false si invalide
    }
    ```
    `importFrom` : type guards manuels (pas de lib), en cas de doublon garder le
    `marked_at` le plus ancien.
  - **Décision documentée (D3)** : la clé est `circuit_id` (id SWS stable) et le
    pays se déduit de `circuits.json` via `country_iso` — ajouter ce commentaire
    en tête du store.
- **Vérification** : vérif standard.
- **Critère** : build vert ; le JSON exporté contient `schema_version: 1`.
- **Dépendances** : 1.2 (types).

#### Étape 5.2 — Bouton « J'y ai roulé » (fiche + popup)

- **Fichiers** : créer `src/components/passport/VisitToggle.tsx` ; modifier
  `src/app/[locale]/circuit/[slug]/page.tsx`, `src/components/map/CircuitPopup.tsx` ;
  messages fr/en.
- **Contenu** :
  - `VisitToggle` (client), props `{ circuitId: number; size?: "sm" | "md" }` :
    bouton toggle. Non visité : style secondary (cf. 3.2) avec icône `Circle`
    et texte `t("passport.markVisited")`. Visité : `bg-kart-50 text-kart-700
    border border-kart-500` icône `CheckCircle2` et `t("passport.visited")`.
    `aria-pressed` reflète l'état. Taille `sm` (popup) : `px-2 py-1 text-xs`.
    **Important hydration** : rendre l'état neutre tant que le store n'est pas
    hydraté (`useEffect` + flag `mounted`).
  - Fiche circuit : `VisitToggle` sous le `<h1>`. Popup : `VisitToggle size="sm"`
    sous le lien « Voir le circuit ».
  - Messages : `passport.markVisited` (« J'y ai roulé »/« I've raced here »),
    `passport.visited` (« Visité »/« Visited »).
- **Vérification** : vérif standard ; en dev : marquer un circuit depuis sa fiche,
  recharger la page → l'état persiste ; le démarquer depuis la popup carte.
- **Critère** : après rechargement complet du navigateur, un circuit marqué reste
  marqué (localStorage `karthopper.passport.v1` non vide).
- **Dépendances** : 5.1, 4.1, 2.5.

#### Étape 5.3 — Compteur + mode passeport sur la carte

- **Fichiers** : créer `src/components/passport/PassportSummary.tsx` ; modifier
  `MapScreen.tsx`, `MapView.tsx` (brancher les props `visitedIds`/`passportMode`
  déjà prévues en 2.4) ; messages fr/en.
- **Contenu** :
  - `PassportSummary` (client), props `{ circuits: Map<number, Circuit> }` :
    calcule depuis le store `X = nb circuits visités`,
    `Y = nb country_iso distincts des circuits visités` ; rend
    `t("passport.summary", {circuits: X, countries: Y})`
    (« {circuits} circuits · {countries} pays ») en `text-sm font-medium
    text-slate-700 tabular-nums`, précédé de l'icône Lucide `Stamp` 16 px
    `text-kart-700`.
  - `MapScreen` : dans l'aside desktop (au-dessus des filtres) et dans le
    peekContent mobile : `PassportSummary` + toggle « mode passeport » :
    `<button role="switch" aria-checked>` libellé `t("passport.mapMode")`
    (« Passeport »), style : actif `bg-kart-50 border-kart-500 text-kart-700` /
    inactif secondary. État local `passportMode` passé à `MapView` avec
    `visitedIds = new Set(Object.keys(visits).map(Number))`.
  - `MapView` : en mode passeport, appliquer les couleurs définies en 2.4
    (visité `#FF5A1F` / non visité `#CBD5E1`, compteur masqué). Les données
    GeoJSON doivent être régénérées quand `visitedIds` change (useMemo).
  - Messages : `passport.summary`, `passport.mapMode`.
- **Vérification** : vérif standard ; en dev : marquer 2 circuits de 2 pays →
  compteur « 2 circuits · 2 pays » ; activer le mode passeport → seuls ces 2
  marqueurs sont orange, le reste gris clair.
- **Critère** : le compteur reflète exactement le localStorage et le toggle
  change la couleur des marqueurs sans rechargement.
- **Dépendances** : 5.1, 5.2, 2.4, 2.6.

#### Étape 5.4 — Export / import JSON

- **Fichiers** : créer `src/components/passport/PassportTransfer.tsx` ; modifier
  `MapScreen.tsx` (sous `PassportSummary`) ; messages fr/en.
- **Contenu** : composant client, deux contrôles côte à côte (`text-xs`) :
  - Export : bouton `t("passport.export")` (icône `Download` 14 px) →
    `new Blob([JSON.stringify(toExport(), null, 2)], {type: "application/json"})`,
    lien téléchargement `karthopper-passeport.json` (créer/cliquer/révoquer
    l'`ObjectURL`).
  - Import : `<label>` stylé bouton + `<input type="file" accept=".json,application/json"
    className="sr-only">` → `file.text()` → `JSON.parse` dans un try/catch →
    `importFrom` ; succès → message inline `t("passport.importOk", {count})`
    (count = total visites après merge) en `text-green-700` ; échec →
    `t("passport.importError")` en `text-red-600`. Jamais d'`alert()`.
  - Messages : `passport.export`, `passport.import`, `passport.importOk`,
    `passport.importError`.
- **Vérification** : vérif standard ; en dev : exporter, vider le localStorage
  (devtools), réimporter le fichier → le compteur revient.
- **Critère** : le cycle export → clear → import restaure exactement le compteur.
- **Dépendances** : 5.3.

---

### Lot 6 — SEO, légal, polish

#### Étape 6.1 — Metadata i18n + landing

- **Fichiers** : modifier `src/app/layout.tsx`, `src/app/[locale]/layout.tsx`,
  `src/app/[locale]/page.tsx` ; messages fr/en.
- **Contenu** :
  - Déplacer le `metadata` statique du root layout vers un `generateMetadata`
    dans `[locale]/layout.tsx` basé sur les messages (`meta.title`,
    `meta.description` — FR = valeurs actuelles du root layout, EN à traduire) ;
    ajouter `alternates.languages` (`fr`, `en`) et `openGraph` (title,
    description, `siteName: "KartHopper"`, `type: "website"`). Le root layout
    garde `lang` dynamique : passer la locale au `<html lang>` — **méthode** :
    root layout minimal sans `<html>` n'est pas possible ; solution imposée :
    `src/app/layout.tsx` conserve `<html lang="fr">` par défaut et
    `[locale]/layout.tsx` ajoute `<meta>` via generateMetadata (le `lang` html
    exact par locale est accepté comme limitation V1 — ne pas restructurer les
    layouts).
  - Landing : sous le CTA, ajouter une ligne de preuve sociale calculée au build
    (Server Component, via `loadCircuits`) : `t("home.circuitsCount",
    {count: 790})` (« {count} circuits dans {countries} pays » — passer aussi
    countries=80 calculé) en `text-sm text-slate-400`.
  - Messages : `meta.title`, `meta.description`, `home.circuitsCount`.
- **Vérification** : vérif standard ; `curl http://localhost:3000/en` (dev) →
  `<title>` anglais présent.
- **Critère** : `/fr` et `/en` ont des `<title>`/`<meta name="description">`
  différents et corrects.
- **Dépendances** : 0.2.

#### Étape 6.2 — sitemap + robots

- **Fichiers** : créer `src/app/sitemap.ts`, `src/app/robots.ts`.
- **Contenu** :
  - Constante `const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ??
    "https://karthopper.com"` (dans `sitemap.ts`).
  - `sitemap.ts` : entrées pour `/fr`, `/en`, `/fr/map`, `/en/map`, puis pour
    chaque circuit `/{locale}/circuit/{slug}` (les deux locales), chacune avec
    `alternates.languages`. `changeFrequency: "daily"` pour les pages map,
    `"weekly"` pour les circuits.
  - `robots.ts` : allow all, `sitemap: BASE_URL + "/sitemap.xml"`.
- **Vérification** : vérif standard ; en dev `curl /sitemap.xml | grep -c circuit`
  → 1580.
- **Critère** : le sitemap contient exactement 4 + 790×2 URLs.
- **Dépendances** : 4.1.

#### Étape 6.3 — Pages légales (RGPD V1)

- **Fichiers** : créer `src/content/legal/fr.ts`, `src/content/legal/en.ts`,
  `src/app/[locale]/mentions-legales/page.tsx`,
  `src/app/[locale]/confidentialite/page.tsx` ; modifier `Footer.tsx`.
- **Contenu** :
  - `src/content/legal/{fr,en}.ts` : exportent
    `legalNotice: { title: string; sections: { heading: string; body: string }[] }`
    et `privacy` (même forme). Contenu à rédiger (concis, honnête) :
    - Mentions légales : éditeur — **placeholders** `[ÉDITEUR — À COMPLÉTER]` et
      `[E-MAIL DE CONTACT — À COMPLÉTER]` (décision Antoine 2026-07-07 : à
      trancher avant tout branchement du domaine public ; **gate** : tant que ces
      placeholders existent, ne pas brancher karthopper.com/.fr), hébergeur
      (« Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA »), source des données (« Données courses
      et circuits © Sodi World Series (sodiwseries.com), affichées avec
      attribution ; KartHopper n'est pas affilié à SWS »), fonds de carte
      (« © MapTiler © OpenStreetMap contributors »).
    - Confidentialité : aucune donnée transmise à un serveur KartHopper ; position
      et ville uniquement dans le navigateur (localStorage) ; passeport karthopping
      en localStorage, effaçable et exportable ; la saisie de ville interroge
      l'API Photon (komoot.io) avec le texte tapé ; pas de cookies tiers, pas de
      tracker ; logs techniques hébergeur (Vercel) ~30 jours ; droits RGPD +
      contact e-mail.
  - Pages : Server Components, rendent titre `<h1 className="font-heading
    text-3xl font-bold">` + sections (`h2` + `<p className="text-slate-700">`)
    dans `<div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-6">`,
    contenu choisi selon `locale`. Metadata title par page (depuis le titre du
    contenu). **Routes non localisées par segment** (mêmes chemins
    `/mentions-legales`, `/confidentialite` pour fr et en — pas de mapping
    `pathnames` next-intl, hors périmètre).
  - `Footer.tsx` : ajouter les deux liens (`t("footer.legalNotice")`,
    `t("footer.privacy")` — messages déjà présents) via `Link` de
    `@/i18n/navigation`, classes `hover:text-slate-700 focus-visible:ring-2
    focus-visible:ring-slate-400 rounded-lg px-1`.
- **Vérification** : vérif standard ; `/fr/mentions-legales` et
  `/en/confidentialite` rendent le contenu.
- **Critère** : les 2 pages existent dans les 2 locales et le footer y mène.
- **Dépendances** : 0.2.

#### Étape 6.4 — Passe a11y + i18n finale

- **Fichiers** : tous les composants créés (revue, modifications ciblées uniquement).
- **Contenu** — checklist binaire à dérouler et corriger :
  1. `grep -rn "\"[A-Za-zÀ-ÿ]\{3,\}" src/components src/app --include=*.tsx`
     ne révèle aucune chaîne UI en dur (hors classes, aria par messages, contenu
     légal dans `src/content/`).
  2. Tout élément interactif a un `focus-visible:ring-2` (grep `onClick` et
     vérifier chaque composant).
  3. Toute icône seule a un `aria-label` ou `aria-hidden="true"` si décorative.
  4. Aucune classe `text-kart-500` dans le code (`grep -rn "text-kart-500" src`
     → 0 résultat).
  5. Toutes les animations ont `motion-reduce:` (grep `transition-`, `animate-`).
  6. Navigation clavier : parcours Tab complet sur `/fr/map` (origine → rayon →
     dates → reset → cartes de course → carte) sans piège de focus.
- **Vérification** : vérif standard + les 6 points ci-dessus documentés
  (résultat de chaque grep) dans le message de commit.
- **Critère** : les greps 1, 4 retournent 0 résultat ; les points 2, 3, 5, 6
  attestés dans le commit.
- **Dépendances** : Lots 2–5 terminés.

---

### Lot 7 — Pipeline données : constat, garde-fous, CI gelée

> Contexte : le scraping SWS est **hors service** (reCAPTCHA, constaté le
> 2026-07-07). Ce lot ne répare PAS le scraping (décision d'Antoine requise) ;
> il évite que la CI tourne pour rien et rend la panne détectable proprement.

#### Étape 7.1 — Détection captcha dans les scripts

- **Fichiers** : modifier `src/lib/config.ts`, `scripts/fetch-circuits.ts`,
  `scripts/scrape-races.ts`.
- **Contenu** :
  - `config.ts` : ajouter
    ```ts
    /** SWS renvoie une page reCAPTCHA (~1,2 Ko) au lieu du contenu quand le scraping est bloqué. */
    export function looksLikeSwsCaptcha(body: string): boolean {
      return body.length < 5000 && body.includes("reCAPTCHA");
    }
    ```
  - `scrape-races.ts` (`fetchHtml`) et `fetch-circuits.ts` (après `response.text()`
    — adapter : lire en texte puis `JSON.parse` au lieu de `response.json()`) :
    si `looksLikeSwsCaptcha` → `throw new Error("SWS_CAPTCHA: scraping bloqué par reCAPTCHA — voir PIPELINE.md")`.
- **Vérification** : vérif standard ; `npm run data:scrape-races:smoke` doit
  maintenant échouer avec exit 1 et le message `SWS_CAPTCHA` (et non plus
  « 0 races » silencieux).
- **Critère** : le smoke test sort en erreur explicite `SWS_CAPTCHA`.
- **Dépendances** : 0.1.

#### Étape 7.2 — Workflows en manuel + doc pipeline

- **Fichiers** : modifier `.github/workflows/fetch-circuits.yml`,
  `.github/workflows/scrape-races.yml` ; créer `PIPELINE.md`.
- **Contenu** :
  - Les deux workflows : **supprimer le bloc `schedule:`** (garder
    `workflow_dispatch`) et ajouter en tête un commentaire :
    `# Cron désactivé le 2026-07-07 : SWS bloque le scraping par reCAPTCHA (voir PIPELINE.md).`
  - `PIPELINE.md` : état des lieux (mêmes faits que §1 de ce plan : endpoints
    testés, réponse 1209 octets, UA/cookies testés), conséquence (seed statique,
    date de référence), et les options de reprise **à trancher par Antoine, aucune
    à implémenter sans son accord** : (a) navigateur headless + résolution
    manuelle périodique du captcha, (b) contact/partenariat SWS pour un accès
    données, (c) export manuel périodique. Rappeler l'engagement légal du cahier
    des charges (retrait immédiat en cas de mise en demeure, attribution).
  - Réactiver les crons = hors périmètre V1.
- **Vérification** : vérif standard ; YAML valide (`node -e` avec un simple
  chargement n'est pas dispo sans dépendance — vérifier visuellement + indentation
  2 espaces conservée).
- **Critère** : plus aucun `schedule:` dans les deux workflows ; `PIPELINE.md`
  existe et liste les 3 options sans en implémenter aucune.
- **Dépendances** : 7.1.

---

## 5. Recette finale V1 (après le dernier lot)

Avec `.env.local` (clé MapTiler + `NEXT_PUBLIC_REFERENCE_DATE=2026-04-01`),
dérouler et cocher :

1. `npm run lint` → 0 erreur ; `npm run build` → vert, route circuit en SSG.
2. `/fr` : landing avec compteur circuits/pays ; switch EN fonctionne.
3. `/fr/map` : carte + clusters ; origine « Clermont-Ferrand » + rayon 200 km +
   période avril 2026 → liste non vide, distances ≤ 200 km, tri par date.
   Chip « Endurance » seule → le compteur chute et toutes les cartes portent le
   badge bleu Endurance.
3bis. Bouton « Partager ces filtres » → l'URL copiée, ouverte en navigation
   privée, reproduit le même compteur. Bouton agenda d'une course → le .ics
   s'importe dans Google Calendar à la bonne date.
4. Clic marqueur → popup ≤ 3 courses + prix ; « Voir le circuit » → fiche SSG.
5. Fiche circuit : photo (ou placeholder), infos, courses à venir, « J'y ai roulé ».
6. Passeport : marquer 2 circuits de 2 pays → « 2 circuits · 2 pays » ; mode
   passeport → marqueurs orange/gris ; export puis import après clear → restauré.
7. Mobile 390 px : bottom sheet 3 états, carte utilisable, bouton recentrer.
8. `/fr/mentions-legales`, `/fr/confidentialite` accessibles depuis le footer.
9. `curl /sitemap.xml` → 1584 URLs.
10. `npx tsx scripts/validate-data.ts --reference-date=2026-04-01` → exit 0 ;
    `npm run data:scrape-races:smoke` → erreur explicite `SWS_CAPTCHA`.

---

## 6. Décisions d'Antoine (recueillies le 2026-07-07)

1. **MapTiler** : Antoine crée le compte (guidé pas à pas) → clé dans
   `.env.local` (`NEXT_PUBLIC_MAPTILER_API_KEY`) + variables Vercel (étape 0.4).
   **Pré-requis bloquant des Lots 2-3** : si la clé n'est pas fournie, STOP.
2. **Données** : développement de toute la V1 sur le seed périmé (via
   `NEXT_PUBLIC_REFERENCE_DATE`) ; en parallèle Antoine contacte SWS pour un
   accès données/partenariat. Aucune tentative de contournement du captcha.
3. **GitHub + Vercel** : branchés dès le Lot 0 (étape 0.4), pushes autorisés en
   fin de lot. **Domaines karthopper.com/.fr NON branchés** tant que : mentions
   légales complétées + données fraîches.
4. **Branche** : `main` (renommage à l'étape 0.1).
5. **Mentions légales** : placeholders `[À COMPLÉTER]` en V1 (étape 6.3) ; gate
   avant tout branchement de domaine public.
6. **Affinage produit après étude du public cible** (SWS = 135 000 pilotes,
   ~14 000 courses/an ; seuls les 16 meilleurs résultats comptent au classement ;
   les pilotes courent dans leur catégorie ; écosystème SaaS — Stint, Apex
   Timing — sans aucun outil de découverte géographique) : **entrent en V1** le
   filtre catégorie (3.2), les filtres partageables par URL (3.6) et l'export
   agenda .ics (3.7) ; **au backlog V2/V3** : coéquipiers endurance, indicateur
   plateau/points, catégories SWS fines (Ironkart, e-Sprint, Women, Master),
   indicateur de niveau des inscrits (idée d'Antoine — dépend du scraping des
   classements SWS, derrière le même reCAPTCHA). Voir la section « reporté ».

### Reste ouvert (à traiter par Antoine, hors exécution du plan)

- Créer la clé MapTiler (guide fourni en session du 2026-07-07).
- Initier le contact SWS (données/partenariat) — modèle de mail à demander si besoin.
- Compléter les coordonnées d'éditeur des mentions légales avant le lancement public.
