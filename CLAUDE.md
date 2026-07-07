# KartHopper — Instructions Claude

## Projet

KartHopper est une plateforme web de découverte de courses de karting de location (Sodi World Series). L'utilisateur visualise les courses sur une carte interactive, filtre par distance/prix/catégorie, et estime son budget déplacement. Modèle freemium à 5 €/mois.

- **Domaines** : karthopper.com, karthopper.fr
- **Repo** : GitHub public (GitHub Actions gratuites)
- **Langue de travail** : français (code et variables en anglais, UI bilingue fr/en)

## Stack technique

- **Frontend** : Next.js (App Router, RSC), TypeScript, Tailwind CSS, shadcn/ui
- **Carte** : MapLibre GL JS + tuiles MapTiler (style Positron personnalisé)
- **Fonts** : Space Grotesk (headings) + Inter (body), chargées via `next/font/google`
- **Backend** : Next.js API routes / Server Actions
- **BDD** : PostgreSQL (Supabase) + PostGIS
- **Cache** : Redis (Upstash)
- **Scraping** : Node.js (Cheerio), exécuté par GitHub Actions (cron)
- **Déploiement** : Vercel
- **Tests** : Vitest (unit) + Playwright (e2e)

## Source de données — SWS

Toutes les données de courses viennent du site Sodi World Series (pas d'API publique).

- **Circuits** : `GET /en-gb/tracks/get_marker` → JSON, 781 circuits, GPS + contact + photos
- **Courses** : `/en-gb/races/YYYY/MM/DD` → HTML calendar (pas de JSON)
- **Détail course** : `/races/{circuit-slug}/{course-slug}-{id}.html` → prix, places, deadline, kart, durée
- **Headers obligatoires** : `User-Agent: Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` + `X-Requested-With: XMLHttpRequest`
- **Scraping multilingue** : circuits `country_iso === "fr"` → `/fr-fr/races/...`, sinon → `/en-gb/races/...`
- **Fréquence** : circuits = hebdomadaire, courses = quotidien

## Direction artistique

Voir [DIRECTION_ARTISTIQUE.md](DIRECTION_ARTISTIQUE.md) pour la palette complète, typo, composants, layouts.

Résumé rapide :
- **Couleur primaire** : Orange `#FF5A1F` (kart-500) — PAS pour texte sur blanc (utiliser kart-700 `#C23D0F`)
- **Texte** : Slate 900 `#0F172A`
- **Border radius** : 8px (`rounded-lg`)
- **Tous les interactifs** : `focus-visible:ring-2` obligatoire (a11y)
- **Animations** : max 200ms, respecter `prefers-reduced-motion`

## Cahier des charges

Voir [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) pour le détail fonctionnel complet (MVP, V2, V3, architecture, légal).

## Conventions de code

- TypeScript strict, pas de `any`
- Composants React : function components, named exports
- Nommage fichiers : `kebab-case.ts` pour les modules, `PascalCase.tsx` pour les composants React
- Imports : absolus avec `@/` (ex: `@/components/race-card`)
- Pas de commentaires évidents — commenter uniquement la logique non triviale
- Formater prix/dates via `Intl.NumberFormat` / `Intl.DateTimeFormat` (pas de formatting maison)
- Données chiffrées : toujours `tabular-nums` (via Inter)

## Structure projet cible

```
src/
  app/              # Next.js App Router pages
  components/       # Composants React réutilisables
    ui/             # shadcn/ui components
  lib/              # Utilitaires, helpers, config
  server/           # Server-side logic (scraping, DB)
  types/            # Types TypeScript partagés
```

## Ce qu'il ne faut PAS faire

- Ne jamais hardcoder des URLs SWS — utiliser des constantes dans `lib/config.ts`
- Ne pas traduire les noms de courses (garder la langue de scraping d'origine)
- Ne pas scraper `/drivers/` ni `/teams/` (interdit par robots.txt SWS)
- Ne pas utiliser de police mono pour les chiffres (Inter `tabular-nums` suffit)
- Ne pas utiliser `#FF5A1F` pour du texte sur fond blanc (ratio contraste insuffisant)

---

## Liens vers le central Claude

Pour situations ambiguës (audit, modification massive, choix de workflow), consulter [`My files/Claude/PRINCIPLES.md`](../../Claude/PRINCIPLES.md) (pas chargé automatiquement, à lire à la demande).

**Conventions TypeScript détaillées** : voir [.claude/rules/typescript-conventions.md](.claude/rules/typescript-conventions.md) (rule scopée `**/*.ts`, `**/*.tsx`, chargée auto par Claude Code quand tu touches un fichier TS).

**Précision langue** : la règle "FR par défaut" du `My files/CLAUDE.md` global s'applique bien ici **pour la communication avec l'utilisateur** (français). Le code/variables/commentaires en anglais (convention dev) ne sont pas un conflit avec la règle globale — ce sont deux choses distinctes.

Skills custom invocables (via `--add-dir`) utiles pour ce projet :
- `/audit-code` — audit lecture-seule structuré
- `/plan-feature` — plan d'implémentation 4 phases (utile avant nouvelle feature)
- `/tdd-cycle` — boucle red-green-refactor (Vitest + Playwright)
- `/end-session` — récap chronologique
- `/llm-council` — conseil de 5 advisors IA pour pression-tester une décision produit / archi / pricing (utile avant un pivot, un choix d'archi non-trivial, ou un trade-off UX significatif)

Hook `auto-format` (Prettier + ESLint --fix après Edit/Write) recommandé : voir snippet dans `My files/Claude/.claude/hooks/auto-format.md` à coller dans `.claude/settings.json` projet.
