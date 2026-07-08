# PLAN_AUDIT_V1 — Correction des findings de l'audit visuel du 2026-07-08

> Rédigé le 2026-07-08 par l'architecte (session d'audit visuel de
> https://karthopper.vercel.app). Exécutant cible : modèle type Sonnet/Haiku.
> **Aucune décision d'architecture, de design ou de périmètre n'est à prendre
> pendant l'exécution : tout est tranché ici.** Référence design :
> `DIRECTION_ARTISTIQUE.md` (DA). Décisions d'Antoine du 2026-07-08 : périmètre =
> les 10 findings, landing = refonte complète DA, style carte = patch au runtime
> (pas de style custom MapTiler Cloud), logo = version SVG simple incluse.

---

## Règles imposées à l'exécutant (identiques à PLAN_V1.md, rappel)

- Respecter `CLAUDE.md` et `AGENTS.md` du repo, TypeScript strict (jamais de
  `any` ni `as any`), ESLint zéro erreur.
- **Aucune nouvelle dépendance npm.** Ce plan n'en ajoute aucune.
- Aucun refactor hors périmètre ; ne pas toucher aux fichiers non listés dans
  l'étape en cours.
- `npm run lint` **et** `npm run build` verts à la fin de **chaque** étape.
  Un commit par étape, message : `AUDIT L<lot>.<étape> — <description courte>`
  (ex. `AUDIT L1.2 — ombre portée des marqueurs`).
  **Push : uniquement `git push origin main` en fin de lot complet.** Jamais de
  force-push.
- Ne jamais toucher à `public/data/circuits.json` ni `public/data/races.json`,
  ni aux scripts de scraping.
- i18n : **toute chaîne visible passe par `src/messages/fr.json` + `en.json`**,
  jamais de texte en dur. Les deux fichiers doivent rester synchrones (mêmes
  clés). FR = tutoiement (charte DA §12).
- Couleurs : jamais `#FF5A1F` (kart-500) pour du texte sur fond **blanc** —
  utiliser `text-kart-700` (#C23D0F). Sur fond slate-900, `text-kart-400`
  (#FF7A45) est autorisé pour le texte (contraste OK sur fond sombre).
- En cas d'ambiguïté : s'arrêter et poser la question, ne jamais improviser.

---

## État des lieux (audit visuel du 2026-07-08)

Constats sur https://karthopper.vercel.app (desktop 1440px + mobile 390px,
zéro erreur console) :

| # | Sévérité | Finding | Fichiers en cause |
|---|----------|---------|-------------------|
| 1 | Majeur | Landing quasi-vide : hero + CTA + une ligne de stats, aucun aperçu produit, aucune section « comment ça marche », énergie DA absente | `src/app/[locale]/page.tsx` |
| 2 | Majeur | Fond de carte Positron brut, non personnalisé (DA §5 : eau #DBEAFE, parcs #DCFCE7, fond #F8FAFC…) | `src/components/map/MapView.tsx:135` |
| 3 | Moyen | Marqueurs non colorés par catégorie dominante (orange/gris seulement, DA §2/§5 : sprint orange, endurance bleu, junior vert, autre violet) | `MapView.tsx`, `MapScreen.tsx` |
| 4 | Moyen | Filtres : pile verticale + inputs natifs (`select`, `type=date`) au style OS, vs pills-dropdown DA §6 | `src/components/races/RaceFilters.tsx` |
| 5 | Moyen | RaceCard sans jauge de places ni durée ni badge indoor/outdoor (DA §6) — en partie car seed périmé (`spots_total` null partout) | `src/components/races/RaceCard.tsx` |
| 6 | Mineur | Marqueurs sans ombre portée, diamètre 24px vs 32px spec | `MapView.tsx` |
| 7 | Mineur | Contrastes faibles : sous-titre hero + compteur circuits en slate-400/500 sur blanc | `page.tsx`, `RaceFilters.tsx` |
| 8 | Mineur | Logo header = pin Lucide générique dans un carré orange ; le favicon damier (`src/app/icon.svg`) existe déjà mais n'est pas réutilisé | `src/components/Header.tsx` |
| 9 | Mineur | Bottom sheet mobile en peek : grand vide blanc sous le compteur | `MapScreen.tsx` (peekContent), `BottomSheet.tsx` |
| 10 | Mineur | « 0 tracks · 0 countries » cryptique pour un premier visiteur | `src/components/passport/PassportSummary.tsx` |

Non couvert par ce plan (dépend des données SWS fraîches, backlog) : variantes
RaceCard « complet »/« presque complet » avec vraies données, badge météo,
panneau budget (V2).

Ordre des lots = gain visuel décroissant. Chaque lot est indépendant ; en cas de
blocage sur un lot, le signaler et passer au suivant.

---

## Lot 1 — Fond de carte personnalisé + polish marqueurs (findings #2, #6)

### 1.1 Module de patch du style Positron

Créer `src/lib/map-style.ts` :

- Exporter `async function loadKartHopperMapStyle(apiKey: string): Promise<StyleSpecification>`
  (type `StyleSpecification` importé depuis `maplibre-gl`).
- La fonction :
  1. `fetch` de `https://api.maptiler.com/maps/positron/style.json?key=${apiKey}`,
     `throw` si `!response.ok`.
  2. Parse le JSON en `StyleSpecification`.
  3. Applique les recolorations ci-dessous en itérant sur `style.layers`.
  4. Mémoïse le résultat dans une variable module (`let cachedStyle`) pour ne
     fetcher qu'une fois par session.

Règles de recoloration (DA §5). Pour chaque layer, tester `layer.id` en
minuscules avec `String.prototype.includes` , dans cet ordre (première règle qui
matche gagne), et ne modifier **que** les propriétés `paint` existantes :

| Si `layer.id` contient | `type` du layer | Propriété à écraser | Valeur |
|---|---|---|---|
| `background` | `background` | `background-color` | `#F8FAFC` |
| `water` (mais PAS `waterway`) | `fill` | `fill-color` | `#DBEAFE` |
| `waterway` | `line` | `line-color` | `#BFDBFE` |
| `park`, `grass`, `wood`, `landcover` | `fill` | `fill-color` | `#DCFCE7` |
| `motorway`, `trunk` | `line` | `line-color` | `#CBD5E1` |
| `road`, `street`, `highway`, `transportation` | `line` | `line-color` | `#E2E8F0` |
| `place` ou `label` | `symbol` | `text-color` (dans `paint`) | `#64748B` |

Notes d'implémentation strictes :
- Ne **pas** toucher aux layers `symbol` autres que la couleur du texte (ne pas
  toucher `text-halo-*`, `layout`, fonts).
- Si une propriété paint attendue n'existe pas sur le layer, passer sans erreur.
- Typage : utiliser les narrowing par `layer.type === "fill"` etc. — les types
  `FillLayerSpecification` etc. de maplibre-gl rendent ça propre sans `any`.
- Aucune suppression de layer, aucun ajout.

### 1.2 Branchement dans MapView + ombre + taille des marqueurs

Dans `src/components/map/MapView.tsx` :

1. Remplacer `mapStyle={`https://api.maptiler.com/...`}` par un état :
   ```tsx
   const [mapStyle, setMapStyle] = useState<StyleSpecification | null>(null);
   const [styleError, setStyleError] = useState(false);
   useEffect(() => {
     if (!apiKey) return;
     let cancelled = false;
     loadKartHopperMapStyle(apiKey)
       .then((style) => { if (!cancelled) setMapStyle(style); })
       .catch(() => { if (!cancelled) setStyleError(true); });
     return () => { cancelled = true; };
   }, [apiKey]);
   ```
   - Si `styleError` : fallback silencieux sur l'URL brute Positron actuelle
     (le site doit rester utilisable si le patch échoue).
   - Tant que `mapStyle === null` et pas d'erreur : rendre le même placeholder
     `animate-pulse bg-slate-100` que le loading de `MapScreen`.
2. **Ombre portée des marqueurs** (les layers `circle` MapLibre n'ont pas de
   drop-shadow) : ajouter un layer `circuit-point-shadow` **avant** (au-dessus
   dans le JSX = en dessous sur la carte) `circuit-point`, même `filter`
   (`["!", ["has", "point_count"]]`), paint :
   ```
   circle-color: "#0F172A", circle-opacity: 0.18, circle-blur: 0.6,
   circle-radius: même expression que circuit-point + 2,
   circle-translate: [0, 2]
   ```
   Idem pour les clusters : layer `clusters-shadow` avant `clusters`
   (radius = step actuel + 2, mêmes autres valeurs d'ombre).
   Ne PAS ajouter ces layers dans `interactiveLayerIds`.
3. **Taille** : `circuit-point` passe de radius 12 (sélectionné 14) à
   **16** (sélectionné **20**, stroke sélectionné 4 inchangé) — DA §5 : 32px de
   diamètre, 40px sélectionné. `text-size` de `circuit-count` passe de 11 à 12.

### 1.3 Vérification et push

- `npm run lint && npm run build` verts.
- `npm run dev` + vérifier visuellement (ou via le script Playwright du Lot 8
  s'il est déjà écrit) : eau bleu pâle, fond crème froid, marqueurs plus gros
  avec ombre. Vérifier que le clic marqueur/cluster fonctionne toujours.
- Commit(s) + `git push origin main`.

---

## Lot 2 — Marqueurs colorés par catégorie dominante (finding #3)

### 2.1 Catégorie dominante par circuit

Dans `src/lib/races.ts`, ajouter :

```ts
const CATEGORY_PRIORITY: RaceCategory[] = ["sprint", "endurance", "junior", "other"];

/** Catégorie majoritaire des courses à venir d'un circuit ; égalité → ordre CATEGORY_PRIORITY. */
export function dominantCategoryByCircuit(
  racesByCircuit: Map<number, Race[]>
): Map<number, RaceCategory> { … }
```

Comptage simple des `race.category` par circuit, maximum, tie-break par
`CATEGORY_PRIORITY` (sprint gagne sur endurance, etc.).

### 2.2 Injection dans le GeoJSON et la paint

- `MapScreen.tsx` : calculer `const dominantCategories = dominantCategoryByCircuit(racesByCircuit);`
  et le passer en prop `dominantCategoryByCircuit={dominantCategories}` à `MapView`.
- `MapView.tsx` :
  - Étendre `CircuitFeatureProperties` avec `category: RaceCategory | "none"`
    (`"none"` si le circuit n'a aucune course à venir) et remplir dans
    `buildCircuitsGeoJson` (nouveau paramètre).
  - Remplacer le `circle-color` de `circuit-point` (mode normal, le mode
    passeport reste inchangé) par :
    ```ts
    ["match", ["get", "category"],
      "sprint", "#FF5A1F",
      "endurance", "#2563EB",
      "junior", "#16A34A",
      "other", "#8B5CF6",
      "#94A3B8"]  // fallback = "none" = aucune course à venir
    ```
    Ces hex sont les tokens `--color-sprint/endurance/junior/special` déjà dans
    `globals.css` — ne pas en inventer d'autres.

### 2.3 Légende implicite

Les chips de catégorie du filtre (Lot 3) servent de légende : au Lot 3, chaque
chip reçoit une pastille de couleur (`●`) de sa catégorie. Rien d'autre à faire
ici. Vérifier, committer, pusher.

---

## Lot 3 — Barre de filtres conforme DA (finding #4)

Objectif DA §6 : rangée horizontale de **pills-dropdown** avec preview de la
valeur, état actif `bg-kart-50 border-kart-500`, compteur de résultats live.
Aucune dépendance : popover maison.

### 3.1 Composant `FilterPill`

Créer `src/components/races/FilterPill.tsx` (client) :

- Props : `icon: LucideIcon`, `label: string` (valeur courante affichée),
  `active: boolean` (filtre ≠ défaut), `children: React.ReactNode` (contenu du
  popover), `id: string`.
- Rendu : `<div className="relative">` contenant :
  - un `<button type="button">` pill : `inline-flex items-center gap-1.5
    rounded-full border px-3 py-1.5 text-sm font-medium` + icône 3.5 +
    `ChevronDown` 3.5 ; classes d'état :
    - actif : `border-kart-500 bg-kart-50 text-kart-700`
    - inactif : `border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
    - toujours : `focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2`
  - `aria-expanded`, `aria-controls={id}`.
  - le popover : `<div id={id} className="absolute left-0 top-full z-50 mt-2
    w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-panel">`,
    rendu seulement si ouvert.
- Fermeture : clic extérieur (listener `pointerdown` sur `document` dans un
  `useEffect` actif seulement quand ouvert, comparaison via un `ref` sur le
  conteneur) + touche `Escape` (refocus le bouton).
- Un seul popover ouvert à la fois n'est PAS requis (état local par pill,
  acceptable V1).

### 3.2 Refonte de `RaceFilters.tsx`

Réorganiser en deux zones :

1. **Rangée de pills** `flex flex-wrap items-center gap-2` :
   - **Pill Position** (icône `MapPin`) : label = `origin?.label ?? t("filters.myPosition")` ;
     actif si `origin !== null` ; contenu = l'actuel `<OriginPicker />`.
   - **Pill Distance** (icône `Ruler`) : label = `radiusKm === 2000 ?
     t("filters.noLimit") : \`< ${radiusKm} km\`` ; actif si `radiusKm < 2000` ;
     contenu = liste verticale de boutons radio stylés (un par valeur de
     `RADIUS_OPTIONS_KM`, `aria-pressed`, coche `Check` sur la valeur courante) —
     **plus de `<select>` natif**. Si `origin === null`, la pill est `disabled`
     avec `opacity-50` et `title={t("filters.needOrigin")}`.
   - **Pill Dates** (icône `Calendar`) : label = plage formatée courte via
     `Intl.DateTimeFormat(locale, { day: "numeric", month: "short" })` :
     `21 mars → …` / `21 mars → 4 avr.` ; actif si `dateFrom !== null || dateTo !== null` ;
     contenu = les deux `input type="date"` actuels (conservés DANS le popover :
     natif acceptable une fois masqué derrière la pill) + bouton texte
     `t("filters.reset")` qui remet `setDateRange(null, null)`.
   - **Chips catégorie** : les 4 boutons actuels restent des chips directes
     (pas de popover), avec ajout d'une pastille couleur :
     `<span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_DOT[category] }} />`
     où `CATEGORY_DOT = { sprint: "#FF5A1F", endurance: "#2563EB", junior: "#16A34A", other: "#8B5CF6" }`.
2. **Rangée statut** `flex items-center justify-between` : compteur
   `t("filters.results", { count })` (inchangé, `tabular-nums`) + boutons
   `Reset` et `Share` regroupés à droite en boutons ghost compacts
   (`text-sm text-slate-600 hover:bg-slate-50`).

Contraintes :
- Aucune modification de `src/store/filters.ts` ni de la logique d'URL
  (`UrlFiltersSync`) : purement présentationnel.
- `t("filters.needOrigin")` passe de `text-slate-400` à `text-slate-500`
  (finding #7).
- Desktop : la zone filtres du panneau (`MapScreen.tsx`, `<div className="border-b …

  p-4">`) devient `sticky top-0 z-10` dans la colonne scrollable — vérifier que
  le scroll de la liste passe bien dessous.
- Mobile (bottom sheet) : mêmes pills, elles wrappent naturellement.

### 3.3 Vérification

Desktop + mobile : ouvrir/fermer chaque popover, clavier (Tab, Escape), états
actifs corrects, compteur live. Lint + build. Commit + push.

---

## Lot 4 — Logo de marque (finding #8)

### 4.1 Composant `Logo`

Créer `src/components/Logo.tsx` (composant serveur, pas de `"use client"`) :

- `export function Logo({ className }: { className?: string })` rendant un
  `<svg viewBox="0 0 32 32" aria-hidden="true">` **reprenant exactement les
  paths de `src/app/icon.svg`** (pin orange + damier 2×2). Pas de re-création :
  copier les paths existants.
- Le SVG doit accepter `className` (taille pilotée par l'appelant).

### 4.2 Usage header + wordmark « hop »

Dans `src/components/Header.tsx` :
- Remplacer le bloc `<div className="… bg-kart-500"><MapPin …/></div>` par
  `<Logo className="h-8 w-8" />` (supprimer l'import `MapPin` s'il devient
  inutilisé).
- Wordmark DA §10 (« H » surélevé) : remplacer
  `{t("common.appName")}` par un rendu en deux tspans JSX :
  ```tsx
  <span className="font-heading text-lg font-bold text-slate-900">
    Kart<span className="relative -top-[2px] inline-block">H</span>opper
  </span>
  ```
  « KartHopper » est un nom propre identique dans les deux locales : ce rendu
  stylé en dur est autorisé ici (exception à la règle i18n, documentée par un
  commentaire). Ne pas supprimer la clé `common.appName` (utilisée ailleurs).

### 4.3 Vérification

Le logo apparaît net à 32px, le damier lisible. Lint/build, commit, push.

---

## Lot 5 — Refonte de la landing (findings #1, #7)

Refonte complète de `src/app/[locale]/page.tsx` (reste un composant serveur).
Structure en 4 sections. **Toutes les chaînes via i18n** — clés et copy exacts
au §5.5.

### 5.1 Section hero (fond sombre, énergie DA)

- Conteneur : `bg-slate-900` pleine largeur (le fond doit toucher le header),
  texte clair. Grille `lg:grid-cols-2` avec `max-w-7xl mx-auto px-4 py-16 lg:py-24`.
- Colonne gauche :
  - `<Logo className="h-12 w-12" />`
  - H1 `font-heading text-4xl sm:text-5xl font-bold text-white` :
    `t("home.heroTitle")` (clé existante, copy inchangé).
  - Sous-titre `text-lg text-slate-300` (contraste AA sur slate-900 — finding
    #7) : `t("home.heroSubtitle")`.
  - CTA existant (bouton kart-500, inchangé) + **CTA secondaire** ghost
    `text-kart-400 hover:bg-slate-800` vers `/map` : `t("home.ctaSecondary")`.
  - Ligne de stats `text-sm text-slate-400` (AA ok sur slate-900) :
    `t("home.circuitsCount", { count, countries })` — clé existante.
- Colonne droite — **aperçu carte réel** cliquable vers `/map` :
  - `<Link href="/map">` autour d'un cadre `relative overflow-hidden rounded-2xl
    border border-slate-700 shadow-panel`.
  - Image MapTiler Static API :
    ```
    https://api.maptiler.com/maps/positron/static/4.85,46.6,4.6/720x480@2x.png?key=${apiKey}
    ```
    via `<img>` HTML standard avec `alt={t("home.mapPreviewAlt")}`,
    `loading="lazy"`, `className="h-auto w-full"`. (`next/image` sur un domaine
    externe exigerait de configurer `next.config.ts` → interdit ici ; ajouter
    `// eslint-disable-next-line @next/next/no-img-element` avec un commentaire
    d'explication si le lint le réclame.)
  - `apiKey` lu via `process.env.NEXT_PUBLIC_MAPTILER_API_KEY`. **Si absent** :
    rendre à la place un bloc `aspect-[3/2] bg-slate-800` (pas d'image cassée).
  - Par-dessus l'image, 4 faux marqueurs décoratifs `aria-hidden="true"`,
    positionnés en absolu (`style={{ left: "…%", top: "…%" }}` :
    (32%, 38%), (55%, 30%), (48%, 62%), (70%, 55%)) : cercles
    `flex h-8 w-8 items-center justify-center rounded-full border-2 border-white
    text-xs font-bold text-white shadow-card`, fonds respectifs `#FF5A1F`,
    `#2563EB`, `#FF5A1F`, `#16A34A`, contenus « 5 », « 3 », « 12 », « 2 ».
  - Badge flottant en bas à gauche du cadre : `bg-white/95 rounded-lg px-3 py-1.5
    text-sm font-medium text-slate-900 shadow-card` :
    `t("home.mapPreviewBadge", { count: raceCount })` où
    `raceCount` = nombre de courses à venir (`upcomingRaces(loadRaces(),
    getReferenceDate()).length` — imports depuis `@/lib/data`, `@/lib/races`,
    `@/lib/reference-date` ; vérifier que `loadRaces` existe dans `lib/data.ts`,
    sinon utiliser la fonction de chargement des courses qui y existe déjà).

### 5.2 Section « comment ça marche » (DA §8)

Fond blanc, `max-w-5xl mx-auto px-4 py-16` :
- H2 `font-heading text-3xl font-semibold text-slate-900 text-center` :
  `t("home.howTitle")`.
- Grille `sm:grid-cols-3 gap-8 mt-10`, trois cartes identiques :
  numéro dans une pastille `flex h-10 w-10 items-center justify-center
  rounded-full bg-kart-50 font-heading text-lg font-bold text-kart-700`,
  icônes Lucide respectives `LocateFixed`, `SlidersHorizontal`, `Flag`
  (`h-6 w-6 text-kart-700`), titre `font-heading font-semibold text-slate-900`,
  description `text-sm text-slate-600`.
  Clés : `home.step1Title/step1Text`, `home.step2Title/step2Text`,
  `home.step3Title/step3Text`.

### 5.3 Section passeport (teaser) + CTA final

- Bande `bg-slate-50 border-y border-slate-200`, `max-w-5xl mx-auto px-4 py-12`,
  layout `sm:flex items-center gap-8` : icône `Stamp` (`h-10 w-10 text-kart-700`),
  H3 `t("home.passportTitle")`, texte `text-slate-600`
  `t("home.passportText")`, lien ghost vers `/map` : `t("home.passportCta")`.
- Section CTA final centrée `py-16` : H2 `t("home.finalCtaTitle")` + le même
  bouton primary vers `/map` (`t("home.cta")`).

### 5.4 Contrastes résiduels (finding #7)

- Dans la nouvelle landing, aucun texte informatif sous `text-slate-500` sur
  fond blanc, ni sous `text-slate-400` sur slate-900.
- `RaceFilters` : déjà traité au Lot 3 (needOrigin → slate-500).

### 5.5 Clés i18n à ajouter (copy exact, ne pas reformuler)

Dans `src/messages/fr.json` (bloc `home`) :

| Clé | FR |
|---|---|
| `home.ctaSecondary` | `"Voir les circuits"` |
| `home.mapPreviewAlt` | `"Aperçu de la carte des circuits KartHopper"` |
| `home.mapPreviewBadge` | `"{count} courses à venir"` |
| `home.howTitle` | `"Comment ça marche"` |
| `home.step1Title` | `"Active ta position"` |
| `home.step1Text` | `"Géolocalisation ou nom de ville : les courses sont triées par distance."` |
| `home.step2Title` | `"Choisis tes filtres"` |
| `home.step2Text` | `"Distance, dates, catégorie — et partage l'URL à tes coéquipiers."` |
| `home.step3Title` | `"Clique sur un circuit"` |
| `home.step3Text` | `"Fiche complète, courses à venir, inscription directe sur SWS."` |
| `home.passportTitle` | `"Ton passeport karthopping"` |
| `home.passportText` | `"Coche les circuits où tu as roulé et collectionne les pays. Tes données restent sur ton appareil, exportables en un clic."` |
| `home.passportCta` | `"Commencer ma collection"` |
| `home.finalCtaTitle` | `"Prêt à trouver ta prochaine course ?"` |

Dans `src/messages/en.json` :

| Clé | EN |
|---|---|
| `home.ctaSecondary` | `"Browse tracks"` |
| `home.mapPreviewAlt` | `"Preview of the KartHopper track map"` |
| `home.mapPreviewBadge` | `"{count} upcoming races"` |
| `home.howTitle` | `"How it works"` |
| `home.step1Title` | `"Set your position"` |
| `home.step1Text` | `"Geolocation or city name: races get sorted by distance."` |
| `home.step2Title` | `"Pick your filters"` |
| `home.step2Text` | `"Distance, dates, category — and share the URL with your teammates."` |
| `home.step3Title` | `"Click a track"` |
| `home.step3Text` | `"Full track page, upcoming races, direct SWS registration."` |
| `home.passportTitle` | `"Your karthopping passport"` |
| `home.passportText` | `"Check off the tracks you've raced and collect countries. Your data stays on your device, exportable in one click."` |
| `home.passportCta` | `"Start my collection"` |
| `home.finalCtaTitle` | `"Ready to find your next race?"` |

### 5.6 Vérification

- FR + EN, desktop + mobile : hero sombre, image statique chargée (vérifier
  l'URL avec la clé en `.env.local`), fake markers positionnés, 3 étapes, bande
  passeport, CTA final. Aucune régression `/map`.
- Lint + build (la landing doit rester statique — vérifier que la page reste ●
  dans la sortie du build ; `loadCircuits`/courses sont des lectures de fichiers
  locales au build, OK).
- Commit(s) + push.

---

## Lot 6 — RaceCard enrichie (finding #5)

Fichier : `src/components/races/RaceCard.tsx`. Les données `spots_*` sont
nulles dans le seed actuel : tout doit être **conditionnel** et ne rien
afficher quand la donnée manque (aucun placeholder « N/A »).

### 6.1 Durée / format de course

- Sous la grille date/kart/distance existante, si `race.timing` est non-null,
  ajouter une entrée `<span className="flex items-center gap-1.5"><Clock …/>
  {race.timing}</span>` dans la même grille (icône `Clock` 3.5, même style).
- Ne PAS utiliser `race.enrichment` (expérimental, `needs_review`).

### 6.2 Jauge de remplissage (DA §6)

Si `race.spots_total !== null && race.spots_taken !== null` :

- Bloc sous la grille : ligne `flex items-center justify-between text-sm` avec
  `<span className="tabular-nums">{spots_taken}/{spots_total}</span>` et le
  pourcentage arrondi ; en dessous une barre :
  `<div className="h-1.5 w-full rounded-full bg-slate-100">` +
  `<div className="h-1.5 rounded-full" style={{ width: \`${pct}%\` }} />` avec
  couleur par seuil : `< 80%` → `bg-kart-500`, `80–99%` → `bg-yellow-500`,
  `100%` → `bg-red-600`.
- États DA :
  - `pct >= 80 && < 100` : `<Badge variant="almost-full">` avec
    `t("race.spotsLeft", { count: spots_total - spots_taken })` (clé existante —
    vérifier son contenu, sinon l'ajouter : FR `"Plus que {count} places"`,
    EN `"Only {count} spots left"`).
  - `pct >= 100` : `<Badge variant="full">{t("race.full")}</Badge>` (clé
    existante), carte `opacity-75`, et le lien SWS remplacé par un `<span>`
    non cliquable `text-slate-400` avec le même libellé.
- Accessibilité : la barre reçoit `role="progressbar"`,
  `aria-valuenow={spots_taken}`, `aria-valuemax={spots_total}`,
  `aria-label={t("race.spots")}` (vérifier le copy de la clé existante).

### 6.3 Badge indoor/outdoor

Si `race.track_type !== null` : ajouter à côté du badge catégorie
`<Badge variant={race.track_type}>` (les variantes `indoor`/`outdoor` existent
dans `Badge.tsx` — vérifier ; sinon les ajouter selon DA §6 : indoor
`bg-indigo-50 text-indigo-600`, outdoor `bg-emerald-100 text-emerald-700`).
Clés i18n : `race.indoor` = FR `"Indoor"` / EN `"Indoor"`, `race.outdoor` =
FR `"Outdoor"` / EN `"Outdoor"` (ajouter si absentes).

### 6.4 Vérification (données nulles obligent)

- Test visuel temporaire : dans `MapScreen` ou via la console, il n'y a pas de
  données réelles → **créer un fichier jetable** `scripts/preview-racecard.md`
  N'EST PAS demandé. À la place : modifier temporairement EN LOCAL (sans
  committer) deux courses dans une copie mémoire — concrètement, dans
  `RaceCard.tsx`, vérifier les 3 états en dur en passant provisoirement
  `race={{ ...race, spots_taken: 35, spots_total: 40 }}` depuis `RaceList`,
  regarder le rendu, puis retirer la modification avant commit (`git diff`
  doit être propre de tout code de test).
- Lint + build + commit + push.

---

## Lot 7 — Mobile peek, passeport vide, divers (findings #9, #10)

### 7.1 Peek du bottom sheet plus utile (finding #9)

Dans `MapScreen.tsx`, remplacer le `peekContent` actuel par :

1. Ligne passeport + toggle (inchangée).
2. Ligne compteur (inchangée) suivie d'un **résumé des filtres actifs** :
   `text-xs text-slate-500`, join(" · ") des segments présents uniquement :
   origine (`origin.label`), distance (si < 2000 : `< X km`), plage de dates
   courte, catégories actives (labels traduits). Si aucun filtre actif :
   `t("filters.noActiveFilters")` — nouvelle clé, FR `"Aucun filtre actif"`,
   EN `"No active filters"`.
3. Bouton pleine largeur `mt-2 rounded-lg bg-kart-500 py-2 text-sm font-medium
   text-white` (mêmes hover/focus que le CTA landing) qui appelle
   `setSheetState("half")` : `t("map.viewList")` — nouvelle clé,
   FR `"Voir les {count} courses"`, EN `"See the {count} races"` (passer
   `{ count: filtered.length }`).

Dans `BottomSheet.tsx` : hauteur peek `25dvh` → `auto` n'est pas possible avec
la transition ; passer `peek: "25dvh"` à `peek: "170px"` (contenu calibré
ci-dessus ≈ 160px) et vérifier qu'il n'y a pas d'overflow (sinon 190px).

### 7.2 Passeport vide explicite (finding #10)

Dans `PassportSummary.tsx` : quand `visitedCircuits.length === 0`, remplacer le
texte du compteur par `t("passport.emptyHint")` (même icône `Stamp`, même
style) — nouvelle clé, FR `"Coche les circuits où tu as roulé pour remplir ton
passeport"`, EN `"Check off tracks you've raced to fill your passport"`.
Le compteur chiffré ne s'affiche qu'à partir d'une visite.

### 7.3 Vérification

Mobile 390px : peek dense sans vide, bouton ouvre la liste, résumé filtres
correct. Passeport vide → phrase d'aide. Lint + build + commit + push.

---

## Lot 8 — Recette visuelle finale

### 8.1 Script de screenshots

Créer `scripts/visual-check.mjs` (dev-only, non importé par l'app) utilisant
Playwright **si et seulement si** disponible : le repo n'a pas Playwright en
dépendance et **on n'en ajoute pas** → le script doit s'exécuter avec
`npx playwright@latest` n'est PAS autorisé non plus (dépendance implicite).
**Décision : pas de script committé.** À la place, recette manuelle documentée :

### 8.2 Checklist de recette (à dérouler et cocher dans le message de fin de lot)

Sur `npm run dev` (ou la préprod Vercel après push), desktop 1440px et mobile
390px, FR et EN :

1. Landing : hero sombre, aperçu carte + faux marqueurs, 3 étapes, bande
   passeport, CTA final, aucun texte à contraste faible.
2. `/map` : fond de carte recoloré (eau bleu pâle), marqueurs 32px ombrés,
   couleurs par catégorie (chercher au moins un marqueur bleu/vert en zoomant
   sur la Belgique ou la région lyonnaise), clusters slate inchangés.
3. Filtres : pills horizontales, popovers ouvrent/ferment (souris + Escape),
   états actifs kart-50, chips catégorie avec pastilles couleur, compteur live,
   partage d'URL intact (copier le lien, l'ouvrir dans un onglet privé,
   vérifier que les filtres se réappliquent).
4. Clic marqueur → popup circuit s'ouvre (point non vérifié par l'audit
   initial : à confirmer explicitement ici), lien vers la fiche circuit OK.
5. Fiche circuit : inchangée, header avec nouveau logo.
6. Mode passeport : toggle, marqueurs orange/gris visités, résumé vide → texte
   d'aide.
7. Mobile : bottom sheet peek dense, bouton « Voir les X courses », drag/toggle
   des 3 états, RaceCards lisibles.
8. `npm run lint`, `npm run build` verts ; sortie du build : pages `[locale]`
   et circuits toujours statiques (●/SSG, cf. piège `setRequestLocale` documenté
   dans la mémoire projet — ne PAS introduire de `useSearchParams`/headers dans
   les pages serveur).

### 8.3 Clôture

- Mettre à jour `README.md` du repo si la landing y est décrite.
- Commit final `AUDIT L8 — recette visuelle` + push.
- Signaler à Antoine les points nécessitant sa vérification manuelle
  (interactions tactiles réelles, rendu sur son téléphone).

---

## Récapitulatif des nouvelles clés i18n (synchroniser fr.json et en.json)

- `home.ctaSecondary`, `home.mapPreviewAlt`, `home.mapPreviewBadge`,
  `home.howTitle`, `home.step{1,2,3}Title`, `home.step{1,2,3}Text`,
  `home.passportTitle`, `home.passportText`, `home.passportCta`,
  `home.finalCtaTitle` (Lot 5)
- `race.indoor`, `race.outdoor` (+ `race.spotsLeft` si absente) (Lot 6)
- `filters.noActiveFilters`, `map.viewList`, `passport.emptyHint` (Lot 7)

## Ce qui reste volontairement hors périmètre

- Variantes RaceCard avec vraies données de places (seed périmé, dépend SWS).
- Badge météo sur marqueurs, panneau budget, mode sombre (V2, DA §2/§5/§6).
- Vrai logo designer (la version SVG du Lot 4 est un intérim assumé).
- Onboarding overlay première visite (DA §8) — à décider avec Antoine après
  cette passe.
