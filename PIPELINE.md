# Pipeline de données SWS — état

> Dernière mise à jour : 2026-07-07.

## Constat

Le scraping de Sodi World Series (sodiwseries.com) est **hors service**. Vérifié
directement le 2026-07-07 sur les quatre endpoints utiles :

- Calendrier des courses : `/en-gb/races/YYYY/MM`
- Fiches course individuelles : `/races/{circuit-slug}/{course-slug}-{id}.html`
- Circuits : `/en-gb/tracks/get_marker`
- `/tracks`

Tous renvoient une page « SWS - reCAPTCHA » de ~1209 octets au lieu du contenu
attendu, quel que soit le contexte :

- User-Agent Googlebot (celui utilisé historiquement par nos scripts) **et**
  User-Agent Chrome standard.
- Avec ou sans cookie de session (`sodiwseries_session`) obtenu depuis la
  page d'accueil.

Seule la page d'accueil (`/en-gb/`) répond normalement.

## Conséquence

- `public/data/circuits.json` et `public/data/races.json` sont figés au
  contenu du dernier scrape réussi (voir `public/data/README.md` pour les
  dates exactes). Le site V1 tourne sur ce seed statique, avec
  `NEXT_PUBLIC_REFERENCE_DATE` pour simuler une date « aujourd'hui » cohérente
  avec des données à venir (voir `PLAN_V1.md`, décision D2).
- Les workflows GitHub Actions `fetch-circuits.yml` et `scrape-races.yml` ont
  leur déclenchement `schedule:` désactivé (seul `workflow_dispatch` manuel
  reste actif) pour ne pas tourner en pure perte.
- `scripts/fetch-circuits.ts` et `scripts/scrape-races.ts` détectent
  désormais ce blocage explicitement (`SWS_CAPTCHA`, voir
  `src/lib/config.ts#looksLikeSwsCaptcha`) plutôt que d'échouer
  silencieusement (ex. « 0 courses trouvées »).

## Options de reprise — à trancher par Antoine, aucune à implémenter sans son accord

1. **Navigateur headless + résolution manuelle périodique du captcha.**
   Techniquement possible (Playwright/Puppeteer) mais fragile, à réévaluer
   selon la fréquence à laquelle SWS réclame une résolution humaine, et zone
   grise vis-à-vis des conditions d'utilisation de SWS.
2. **Contact / partenariat avec SWS** pour un accès aux données (API,
   export, ou levée du blocage). Option privilégiée par Antoine
   (voir `PLAN_V1.md` §6).
3. **Export manuel périodique** (scrape ponctuel manuel quand le captcha
   n'est pas déclenché, ou saisie manuelle d'un sous-ensemble de données).

## Rappel légal (cahier des charges)

- Retrait immédiat des données en cas de mise en demeure de SWS.
- Attribution systématique (lien vers sodiwseries.com sur chaque fiche
  circuit/course — déjà en place dans l'UI V1).
- Ne jamais scraper `/drivers/` ni `/teams/` (interdit par le robots.txt SWS).

Réactiver les crons `schedule:` est **hors périmètre de la V1** : à faire
uniquement après qu'une des options ci-dessus a été choisie et validée par
Antoine.
