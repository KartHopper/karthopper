# AGENTS.md

<!-- codex_generated: true -->
<!-- generator: codex-bootstrap-v4 -->
<!-- source_file: C:/Users/rasta/Proton Drive/antoineolivier/My files/Passions/Karting/KartHopper/CLAUDE.md -->
<!-- source_sha256: c69299a12768e6d43728e69c51cd9fd6b5fb00665758f9eb7c6fa34736c5fbc2 -->
<!-- canary_project: CANARY_PROJECT_692D5195 -->
<!-- canary_subdir: CANARY_SUBDIR_692D5195 -->

## Codex Migration Contract
- Source of truth: CLAUDE.md
- This file is generated. Manual edits can be overwritten.
- Runtime fallback is explicit: missing/invalid AGENTS.md must block execution.

## Canary Tokens
- CANARY_PROJECT_692D5195
- CANARY_SUBDIR_692D5195

## Imported Instructions

# KartHopper â€” Instructions Codex

## Projet

KartHopper est une plateforme web de dÃ©couverte de courses de karting de location (Sodi World Series). L'utilisateur visualise les courses sur une carte interactive, filtre par distance/prix/catÃ©gorie, et estime son budget dÃ©placement. ModÃ¨le freemium Ã  5 â‚¬/mois.

- **Domaines** : karthopper.com, karthopper.fr
- **Repo** : GitHub public (GitHub Actions gratuites)
- **Langue de travail** : franÃ§ais (code et variables en anglais, UI bilingue fr/en)

## Stack technique

- **Frontend** : Next.js (App Router, RSC), TypeScript, Tailwind CSS, shadcn/ui
- **Carte** : MapLibre GL JS + tuiles MapTiler (style Positron personnalisÃ©)
- **Fonts** : Space Grotesk (headings) + Inter (body), chargÃ©es via `next/font/google`
- **Backend** : Next.js API routes / Server Actions
- **BDD** : PostgreSQL (Supabase) + PostGIS
- **Cache** : Redis (Upstash)
- **Scraping** : Node.js (Cheerio), exÃ©cutÃ© par GitHub Actions (cron)
- **DÃ©ploiement** : Vercel
- **Tests** : Vitest (unit) + Playwright (e2e)

## Source de donnÃ©es â€” SWS

Toutes les donnÃ©es de courses viennent du site Sodi World Series (pas d'API publique).

- **Circuits** : `GET /en-gb/tracks/get_marker` â†’ JSON, 781 circuits, GPS + contact + photos
- **Courses** : `/en-gb/races/YYYY/MM/DD` â†’ HTML calendar (pas de JSON)
- **DÃ©tail course** : `/races/{circuit-slug}/{course-slug}-{id}.html` â†’ prix, places, deadline, kart, durÃ©e
- **Headers obligatoires** : `User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` + `X-Requested-With: XMLHttpRequest`
- **Scraping multilingue** : circuits `country_iso === "fr"` â†’ `/fr-fr/races/...`, sinon â†’ `/en-gb/races/...`
- **FrÃ©quence** : circuits = hebdomadaire, courses = quotidien

## Direction artistique

Voir [DIRECTION_ARTISTIQUE.md](DIRECTION_ARTISTIQUE.md) pour la palette complÃ¨te, typo, composants, layouts.

RÃ©sumÃ© rapide :
- **Couleur primaire** : Orange `#FF5A1F` (kart-500) â€” PAS pour texte sur blanc (utiliser kart-700 `#C23D0F`)
- **Texte** : Slate 900 `#0F172A`
- **Border radius** : 8px (`rounded-lg`)
- **Tous les interactifs** : `focus-visible:ring-2` obligatoire (a11y)
- **Animations** : max 200ms, respecter `prefers-reduced-motion`

## Cahier des charges

Voir [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) pour le dÃ©tail fonctionnel complet (MVP, V2, V3, architecture, lÃ©gal).

## Conventions de code

- TypeScript strict, pas de `any`
- Composants React : function components, named exports
- Nommage fichiers : `kebab-case.ts` pour les modules, `PascalCase.tsx` pour les composants React
- Imports : absolus avec `@/` (ex: `@/components/race-card`)
- Pas de commentaires Ã©vidents â€” commenter uniquement la logique non triviale
- Formater prix/dates via `Intl.NumberFormat` / `Intl.DateTimeFormat` (pas de formatting maison)
- DonnÃ©es chiffrÃ©es : toujours `tabular-nums` (via Inter)

## Structure projet cible

```
src/
  app/              # Next.js App Router pages
  components/       # Composants React rÃ©utilisables
    ui/             # shadcn/ui components
  lib/              # Utilitaires, helpers, config
  server/           # Server-side logic (scraping, DB)
  types/            # Types TypeScript partagÃ©s
```

## Ce qu'il ne faut PAS faire

- Ne jamais hardcoder des URLs SWS â€” utiliser des constantes dans `lib/config.ts`
- Ne pas traduire les noms de courses (garder la langue de scraping d'origine)
- Ne pas scraper `/drivers/` ni `/teams/` (interdit par robots.txt SWS)
- Ne pas utiliser de police mono pour les chiffres (Inter `tabular-nums` suffit)
- Ne pas utiliser `#FF5A1F` pour du texte sur fond blanc (ratio contraste insuffisant)

---

## Liens vers le central Codex

Pour situations ambiguÃ«s (audit, modification massive, choix de workflow), consulter [`My files/Codex/PRINCIPLES.md`](../../Codex/PRINCIPLES.md) (pas chargÃ© automatiquement, Ã  lire Ã  la demande).

**Conventions TypeScript dÃ©taillÃ©es** : voir [.codex/rules/typescript-conventions.md](.codex/rules/typescript-conventions.md) (rule scopÃ©e `**/*.ts`, `**/*.tsx`, chargÃ©e auto par Codex Code quand tu touches un fichier TS).

**PrÃ©cision langue** : la rÃ¨gle "FR par dÃ©faut" du `My files/CLAUDE.md` global s'applique bien ici **pour la communication avec l'utilisateur** (franÃ§ais). Le code/variables/commentaires en anglais (convention dev) ne sont pas un conflit avec la rÃ¨gle globale â€” ce sont deux choses distinctes.

Skills custom invocables (via `--add-dir`) utiles pour ce projet :
- `/audit-code` â€” audit lecture-seule structurÃ©
- `/plan-feature` â€” plan d'implÃ©mentation 4 phases (utile avant nouvelle feature)
- `/tdd-cycle` â€” boucle red-green-refactor (Vitest + Playwright)
- `/end-session` â€” rÃ©cap chronologique
- `/llm-council` â€” conseil de 5 advisors IA pour pression-tester une dÃ©cision produit / archi / pricing (utile avant un pivot, un choix d'archi non-trivial, ou un trade-off UX significatif)

Hook `auto-format` (Prettier + ESLint --fix aprÃ¨s Edit/Write) recommandÃ© : voir snippet dans `My files/Codex/.codex/hooks/auto-format.md` Ã  coller dans `.codex/settings.json` projet.
