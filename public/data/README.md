# Données KartHopper

Fichiers JSON statiques servis directement par Next.js (`/data/*.json`), générés
par les scripts de `scripts/` et normalement mis à jour par les workflows
GitHub Actions (voir `PIPELINE.md` pour leur état actuel).

## `circuits.json`

- **790 circuits** réels dans **80 pays**, avec GPS, photos, slug, devise.
- Fetché le **2026-05-28** via `npm run data:fetch-circuits`.
- Utilisable tel quel.

## `races.json`

- **3307 courses** réelles mais **toutes passées** : du 2026-03-18 au 2026-05-31.
- Scrapé le **2026-03-19** via `npm run data:scrape-races`.
- `spots_taken` / `spots_total` sont **null partout** dans ce fichier (le
  parsing des places a été corrigé après ce scrape — voir `races.test.json`
  ci-dessous pour un échantillon avec places).
- Le pipeline de scraping est actuellement bloqué par un reCAPTCHA SWS (voir
  `PIPELINE.md`) : ce fichier ne sera pas rafraîchi tant que ce n'est pas résolu.
- Pour développer/tester contre des courses "à venir", utiliser
  `NEXT_PUBLIC_REFERENCE_DATE` (voir README racine) plutôt que d'attendre des
  données fraîches.

## Fichiers `*.test.json`

- `races.test.json`, `races.enriched.groq-scout.test.json`, `unmatched.test.json` :
  artefacts produits par les scripts en mode `--test`, **non utilisés par le
  site**. Conservés à titre d'échantillons de référence (ex. places
  disponibles correctement parsées).
