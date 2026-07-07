# KartHopper

Trouve ta prochaine course de karting en 30 secondes. Carte interactive des
circuits Sodi World Series (SWS), liste des courses filtrable par distance,
période et catégorie, et passeport « karthopping » local pour suivre les
circuits visités.

## Démarrer

```bash
npm install
```

Crée un fichier `.env.local` à la racine avec :

```
NEXT_PUBLIC_MAPTILER_API_KEY=<ta clé MapTiler>
NEXT_PUBLIC_REFERENCE_DATE=2026-04-01
```

- `NEXT_PUBLIC_MAPTILER_API_KEY` : clé du fournisseur de tuiles cartographiques
  (gratuite, voir cloud.maptiler.com). Sans elle, la page carte affiche un état
  d'erreur.
- `NEXT_PUBLIC_REFERENCE_DATE` : date "aujourd'hui" pilotable, utile tant que le
  seed de données est périmé (voir ci-dessous). À retirer en production une
  fois le pipeline de scraping réparé.

```bash
npm run dev
```

> ⚠️ **Le scraping SWS est actuellement bloqué par un reCAPTCHA** (constaté le
> 2026-07-07). Ne relance pas les scripts `data:*` sans avoir lu
> [`PIPELINE.md`](PIPELINE.md).

## Données

Voir [`public/data/README.md`](public/data/README.md) pour la provenance et la
fraîcheur de chaque fichier JSON.

## Scripts

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement Next.js |
| `npm run build` | Build de production |
| `npm run lint` | ESLint |
| `npm run data:fetch-circuits` | Scraping des circuits SWS → `circuits.json` |
| `npm run data:scrape-races` | Scraping des courses SWS → `races.json` |
| `npm run data:scrape-races:smoke` | Smoke test du scraping (5 courses max) |
| `npm run data:scrape-races:test` | Scrape de test (limité) → `races.test.json` |
| `npm run data:enrich-races` | Enrichissement LLM expérimental des courses |
| `npm run data:validate` | Validation des fichiers de données générés |

## Documentation projet

- [`CAHIER_DES_CHARGES.md`](CAHIER_DES_CHARGES.md) — cahier des charges complet (MVP, V2, V3)
- [`DIRECTION_ARTISTIQUE.md`](DIRECTION_ARTISTIQUE.md) — palette, typographie, composants
- [`PLAN_V1.md`](PLAN_V1.md) — plan d'exécution détaillé de la V1
- [`PIPELINE.md`](PIPELINE.md) — état du pipeline de données SWS (une fois créé, Lot 7)
- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — conventions pour les assistants IA
