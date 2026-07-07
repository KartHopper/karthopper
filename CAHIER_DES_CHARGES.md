# KartHopper — Cahier des Charges Complet

> Document généré le 17 mars 2026
> Version 1.3 — Second audit : corrections a11y, scraping multilingue, sync DA, nettoyage incohérences

---

## Table des matières

1. [Phase 1 — Évaluation des APIs tierces](#phase-1--évaluation-des-apis-tierces)
   - 1.1 Transport voiture — 1.2 Train — 1.3 Avion — 1.4 Covoiturage — 1.5 Hébergement — 1.6 Météo — 1.7 Récapitulatif
2. [Phase 2 — Cahier des charges fonctionnel](#phase-2--cahier-des-charges-fonctionnel)
   - 2.1 Vision produit — 2.2 MVP (V1) — 2.3 V2 Premium — 2.4 V3 Avancées — 2.5 Matrice de priorisation — 2.6 Modèle freemium
3. [Phase 3 — Architecture technique](#phase-3--architecture-technique)
   - 3.1 Stack — 3.2 Schéma — 3.3 Pipeline SWS — 3.4 Cache — 3.5 Structure projet — 3.6 Choix technos — 3.7 Plan de dev
4. [Cadre légal et conformité](#cadre-légal-et-conformité)
5. [Stratégie de lancement](#stratégie-de-lancement)
6. [Prochaines étapes concrètes](#prochaines-étapes-concrètes)

---

## Données SWS disponibles — Mise à jour importante

L'analyse initiale indiquait que le prix, les places restantes et la durée de roulage n'étaient pas disponibles sur SWS. **C'est faux.** Les pages détail de chaque course (`/races/{circuit-slug}/{course-slug}-{id}.html`) contiennent des données riches :

| Champ | Exemple | Impact KartHopper |
|-------|---------|-------------------|
| **Prix d'inscription** | 90,00 EUR | Filtre par prix, calcul budget total réel |
| **Places prises / totales** | 19 / 40 | Affichage "plus que X places", filtre "places disponibles" |
| **Date limite d'inscription** | 21/03/2026 | Alerte "inscription bientôt close" |
| **Modèle de kart** | SODI SPORT Honda - GX 270cc | Filtre par modèle (déjà prévu) |
| **Timing / durée de roulage** | Course 1 - 10 min, Course 2 - 10 min, Course 3 - 10 min | Filtre par durée, info clé pour l'utilisateur |
| **Lest** | Oui / Non | Info utile pour les pilotes |
| **Type de piste** | Outdoor / Indoor | Filtre indoor/outdoor |
| **Commentaires** | Texte libre (infos d'inscription, etc.) | Affichage dans la fiche course |
| **Référence** | FR-RAC-03-120291 | ID interne SWS |

**Conséquence sur le pipeline :** le scraping quotidien des courses doit inclure un passage sur chaque fiche course individuelle (pas seulement le calendrier mensuel) pour récupérer ces données. Cela augmente le nombre de requêtes (de ~3 pages calendrier à ~3 + N fiches courses), mais avec un cache intelligent (scraper uniquement les nouvelles courses ou celles mises à jour), ça reste gérable.

**Conséquence sur le produit :** le prix d'inscription réel + les places restantes transforment le filtre "budget max" d'une estimation à une donnée fiable. C'est un upgrade majeur de la proposition de valeur.

---

# Phase 1 — Évaluation des APIs tierces

## 1.1 Transport — Voiture (routing + carburant + péages)

### Routing

| API | Dispo | Free tier | Qualité | Intégration | Verdict |
|-----|-------|-----------|---------|-------------|---------|
| **OpenRouteService** | ✅ | 2 000 req/jour (~60K/mois), gratuit. Self-hosted = illimité | Bonne (basée sur OSM). Excellente en Europe, variable ailleurs. Pas de trafic temps réel | Facile. REST API bien documentée, Docker pour self-hosting | **Retenu (primaire)** |
| Google Directions API | ✅ | 200$/mois de crédit gratuit → ~40K req/mois | Excellente. Trafic temps réel, couverture mondiale | Très facile. Mais ToS impose affichage sur Google Maps (incompatible Mapbox/Leaflet) | **Écarté** — contrainte ToS sur la carte |
| OSRM | ✅ | Open source, self-hosted uniquement | Bonne, très rapide | Moyenne (self-hosting requis) | Fallback si ORS insuffisant |

**Mappy API (évaluée) :** Mappy propose une API de calcul d'itinéraire avec estimation du coût (carburant + péages) intégrée — ce qui serait idéal. Cependant, l'API Mappy n'est **pas en libre accès** : elle nécessite un partenariat commercial (pas de self-service, pas de free tier public). La couverture est limitée à la France et quelques pays européens. **Écartée** pour le MVP — à reconsidérer si un partenariat devient possible.

**Décision :** OpenRouteService en primaire. Gratuit, pas de contrainte de carte, 2 000 req/jour suffisent largement (on cache les trajets). Self-hosting possible si besoin de monter en charge.

### Carburant

Aucune API ne fournit le coût carburant directement. **Stratégie retenue :**
- Distance fournie par ORS
- Calcul : `distance_km / conso_L_100km × prix_litre`
- Consommation paramétrable par l'utilisateur (défaut : 7 L/100 km)
- Prix du carburant : données du **Bulletin pétrolier de la Commission Européenne** (gratuit, mis à jour hebdomadairement, couvre toute l'UE) + fallback par pays avec prix manuels

### Péages

| API | Dispo | Free tier | Qualité | Verdict |
|-----|-------|-----------|---------|---------|
| **TollGuru** | ✅ | 200 req/mois gratuit. Payant à partir de ~49$/mois | Très bonne. 60+ pays, coûts par type de véhicule. Fournit aussi une estimation carburant | **Retenu pour V2** |
| ViaMichelin API | ⚠️ | Accès réservé aux partenaires enterprise. Pas de self-service | Excellente en Europe | **Écarté** — non accessible |

**Décision :** 200 req/mois est trop limité pour le MVP. **Fallback MVP :** estimation heuristique (coefficient moyen de péage/km par pays, basé sur données connues). TollGuru intégré en V2 quand le volume d'utilisateurs premium justifie le coût.

**Fallback heuristique péages :**
- France : ~0.09 €/km autoroute
- Italie : ~0.07 €/km
- Espagne : ~0.09 €/km
- Allemagne/Pologne : gratuit (autoroutes)
- Autres pays : coefficient moyen ou 0 si pas de péage
- Multiplié par le % estimé de route autoroutière (déduit de la distance totale vs distance à vol d'oiseau)

---

## 1.2 Transport — Train

| API | Dispo | Free tier | Prix dispo ? | Verdict |
|-----|-------|-----------|-------------|---------|
| Trainline | ⚠️ | Programme affilié uniquement. Pas d'API de recherche de prix | ❌ Redirection seulement | Liens affiliés uniquement |
| SNCF Open Data | ✅ | Gratuit | ❌ Horaires seulement, pas de prix dynamiques (TGV) | Utile pour les durées, pas les prix |
| Deutsche Bahn API | ✅ | Gratuit | ❌ Horaires seulement | Idem SNCF |
| Omio (GoEuro) | ⚠️ | Affilié uniquement | ❌ Pas d'API publique | Liens affiliés uniquement |
| **Kiwi.com Tequila** | ✅ | Gratuit sur candidature. ~100-300 req/min | ⚠️ Couvre trains + bus + avions. Prix indicatifs | **Meilleure option** |

**Constat critique :** Aucun opérateur ferroviaire européen ne fournit d'API publique avec prix en temps réel. C'est le maillon le plus faible de l'écosystème.

**Décision :**
- **MVP :** Estimation heuristique basée sur la distance + lien profond Trainline/Omio (avec tracking affilié)
- **V2 :** Intégration Kiwi.com Tequila (couvre trains + bus + avions dans une seule API)

**Fallback heuristique train :**
- Fourchette de prix estimée selon la distance :
  - < 200 km : 15–40 €
  - 200–500 km : 30–80 €
  - 500–1000 km : 60–150 €
  - > 1000 km : 100–250 €
- Durée estimée : distance / 150 km/h (vitesse moyenne TGV/ICE avec correspondances)
- Mention explicite : "Prix indicatif — [Voir les vrais prix sur Trainline →]" avec lien affilié

---

## 1.3 Transport — Avion

| API | Dispo | Free tier | Qualité | Verdict |
|-----|-------|-----------|---------|---------|
| **Kiwi.com Tequila** | ✅ | Gratuit (candidature). Généreux | Très bonne. Flights + trains + bus. "Virtual interlining" | **Retenu** |
| Amadeus Self-Service | ✅ | 2 000 appels/mois gratuits | Excellente (GDS majeur) | Backup si Kiwi insuffisant |
| Skyscanner | ⚠️ | API publique fermée depuis ~2020. Wrappers RapidAPI peu fiables | N/A | **Écarté** |
| Google Flights | ❌ | Pas d'API publique | N/A | **Écarté** |

**Décision :** Kiwi.com Tequila en primaire (couvre aussi trains/bus = un seul partenaire). Amadeus en backup. Affiché uniquement pour distance > 500 km.

---

## 1.4 Covoiturage

| API | Dispo | Free tier | Verdict |
|-----|-------|-----------|---------|
| BlaBlaCar | ❌ | API publique fermée depuis ~2019-2020 | **Non disponible** |

**Décision :** Pas d'intégration API. Deux alternatives :
1. **Deep link vers BlaBlaCar** avec paramètres de recherche pré-remplis (origine, destination, date)
2. **Estimation covoiturage** = (coût carburant + péages) / nombre de passagers — c'est le modèle de pricing BlaBlaCar de toute façon

---

## 1.5 Hébergement

| API | Dispo | Free tier | Qualité | Verdict |
|-----|-------|-----------|---------|---------|
| **Booking.com Affiliate** | ✅ | Gratuit (affilié). Commission 25-40% de la commission Booking | Excellente. Plus grand inventaire mondial | **Retenu (V2)** |
| Expedia Affiliate | ✅ | Gratuit (affilié). Programme similaire | Bonne | Backup |
| Google Hotels | ⚠️ | Pas d'API de recherche publique | N/A | **Écarté** |
| Airbnb | ❌ | Pas d'API publique | N/A | **Écarté** |

**Décision :**
- **MVP :** Estimation heuristique du prix d'une nuit + deep link Booking.com (avec tracking affilié)
- **V2 :** Intégration Booking.com Affiliate API (nécessite approbation, seuil de trafic minimum)

**Fallback heuristique hébergement :**
- Fourchette par gamme, ajustée par pays (coût de la vie) :
  - Budget (Ibis, Formule 1, hostel) : 40–70 €/nuit
  - Moyen (hôtel 3 étoiles) : 60–120 €/nuit
  - Premium (hôtel 4 étoiles) : 100–200 €/nuit
- Coefficients par pays : France = 1.0, Allemagne = 1.1, Italie = 0.9, Pologne = 0.6, etc.
- Mention : "Prix indicatif — [Voir les hôtels sur Booking.com →]" avec lien affilié

---

## 1.6 Météo

### Prévisions (< 14 jours)

| API | Dispo | Free tier | Couverture | Prévision max | Verdict |
|-----|-------|-----------|------------|---------------|---------|
| **Open-Meteo** | ✅ | 10 000 req/jour, sans clé API | ✅ Mondiale (multi-modèles) | 16 jours | **Retenu** |
| OpenWeatherMap | ✅ | 1 000 req/jour, clé requise | ✅ Mondiale | 5 jours (gratuit) | Trop limité |
| WeatherAPI.com | ✅ | 1M req/mois, clé requise | ✅ Mondiale | 3 jours (gratuit) | Trop limité |
| Visual Crossing | ✅ | 1 000 records/jour | ✅ Mondiale | 15 jours | Trop cher pour 781 lieux |

**Décision :** Open-Meteo, sans hésitation. Gratuit, sans clé API, 16 jours de prévision, mondial, open source. Paramètres disponibles : température, probabilité de pluie, vent, code météo WMO, humidité, UV.

### Données climatiques (> 14 jours)

| Source | Type | Gratuit | Moyennes mensuelles | Couverture | Verdict |
|--------|------|---------|---------------------|-----------|---------|
| **NASA POWER** | REST API | ✅ Sans clé | ✅ Directement | ✅ Mondiale | **Retenu (primaire)** |
| Open-Meteo Historical | REST API | ✅ 10K req/jour | À calculer depuis données journalières | ✅ Mondiale (ERA5) | **Retenu (enrichissement)** |
| WorldClim | Fichiers GeoTIFF | ✅ | ✅ Normales 1970-2000 | ✅ Mondiale | Backup statique |
| Meteostat | API + Python | ✅ | ✅ Par station | ⚠️ Dépend des stations | Complémentaire |

**Décision :**
- **NASA POWER API** en primaire : retourne directement les moyennes mensuelles par coordonnées GPS, gratuit, sans clé, mondial. Un batch one-shot de 781 requêtes → fichier JSON statique permanent.
- **Open-Meteo Historical** en enrichissement si besoin de stats plus fines (% jours de pluie par mois).
- Les données climatiques sont calculées **une seule fois** et cachées indéfiniment (le climat ne change pas d'un mois à l'autre).

---

## 1.7 Tableau récapitulatif — APIs retenues et fallbacks

| Besoin | API retenue (MVP) | API retenue (V2) | Fallback heuristique |
|--------|-------------------|-------------------|----------------------|
| **Routing voiture** | OpenRouteService (gratuit, 2K req/jour) | Idem ou self-hosted | Calcul distance à vol d'oiseau × 1.3 |
| **Carburant** | Calcul : distance × conso × prix/L | Idem + prix carburant auto (Commission EU) | Prix moyen 1.70 €/L, conso 7 L/100 km |
| **Péages** | Estimation heuristique par pays | TollGuru (200 req/mois gratuit) | Coefficient €/km par pays |
| **Train** | Estimation par distance + lien affilié Trainline | Kiwi.com Tequila | Fourchette de prix par tranche de distance |
| **Avion** | Affiché si > 500 km. Lien affilié | Kiwi.com Tequila ou Amadeus | Fourchette par distance |
| **Covoiturage** | Deep link BlaBlaCar + estimation (carburant/n) | Idem | Coût voiture ÷ nb passagers |
| **Hébergement** | Estimation par gamme/pays + lien Booking | Booking.com Affiliate API | 40–200 €/nuit selon gamme et pays |
| **Météo forecast** | Open-Meteo (gratuit, 16j) | Idem | — |
| **Météo climat** | NASA POWER (gratuit, moyennes mensuelles) | + Open-Meteo Historical | WorldClim statique |

### Budget API mensuel estimé

| Poste | Coût MVP | Coût V2 |
|-------|----------|---------|
| OpenRouteService | 0 € | 0 € (ou ~20 €/mois si self-hosted VPS) |
| Open-Meteo | 0 € | 0 € (ou 15 €/mois si commercial) |
| NASA POWER | 0 € | 0 € |
| Kiwi.com Tequila | — | 0 € (commission affiliée) |
| TollGuru | — | 0 € (200 req/mois) ou 49 $/mois |
| Booking.com Affiliate | — | 0 € (commission affiliée) |
| **Total** | **0 €** | **0–70 €/mois** |

---

# Phase 2 — Cahier des charges fonctionnel

## 2.1 Vision produit

**KartHopper** est le moteur de recherche géographique des courses de karting en location (rental karting). Il résout un problème simple : SWS liste les courses mais ne permet pas de visualiser ce qui est proche de soi, ni d'estimer le vrai coût d'un weekend karting (inscription + transport + hébergement).

**Proposition de valeur :**
- "Trouve ta prochaine course de karting en 30 secondes"
- "Sache exactement combien ça va te coûter, tout compris"

**Utilisateur cible :** Kartiste amateur qui court régulièrement en SWS, principalement européen (France, Italie, Allemagne, Pologne, Espagne = 370 circuits sur 781).

---

## 2.2 MVP (V1) — Fonctionnalités cœur

### F1. Carte interactive des circuits
- Carte plein écran (MapLibre GL JS via react-map-gl + tuiles MapTiler/Protomaps)
- 781 marqueurs de circuits avec clustering automatique par zoom
- Géolocalisation du navigateur pour centrer la carte + marqueur "ma position"
- Zoom/pan fluide, style carto clean (pas surchargé)
- Icône de marqueur avec indicateur visuel du nombre de courses à venir
- Complexité : **M**

### F2. Fiche circuit au clic
- Popup ou panneau latéral au clic sur un marqueur
- Informations affichées :
  - Nom du circuit, ville, pays, drapeau
  - Photo du circuit (URL SWS)
  - Adresse, téléphone, site web
  - Distance depuis la position de l'utilisateur (à vol d'oiseau)
  - Type de piste (indoor/outdoor) — disponible via scraping fiche course/circuit
  - Lien vers la page SWS
  - Liste des prochaines courses sur ce circuit
- Complexité : **S**

### F3. Liste des courses (panneau latéral)
- Panneau latéral scrollable, synchronisé avec la carte
- Chaque carte de course affiche :
  - Titre de la course
  - Date + date limite d'inscription
  - Circuit + ville + pays
  - Catégorie (icône : sprint / endurance / junior)
  - **Prix d'inscription** (ex: 90 €)
  - **Places restantes** (ex: "21 places restantes sur 40") + badge "complet" si 0
  - **Modèle de kart** (ex: SODI SPORT Honda - GX 270cc)
  - **Durée de roulage** (ex: 3 × 10 min = 30 min)
  - Distance depuis l'utilisateur
  - Lien "S'inscrire sur SWS →"
- Tri par : date (défaut), distance, prix, places restantes
- Synchronisation carte ↔ liste : clic sur une course centre la carte, zoom sur la carte filtre la liste
- Complexité : **M**

### F4. Filtres combinables
- Barre de filtres en haut ou panneau dédié
- Filtres disponibles :
  - **Distance max** : slider 0–2000 km (requiert géolocalisation ou adresse manuelle)
  - **Plage de dates** : date picker (défaut : aujourd'hui → +3 mois)
  - **Pays** : dropdown multi-sélection (79 pays)
  - **Catégorie** : sprint / endurance / junior (checkboxes)
  - **Prix d'inscription max** : slider 0–300 € (données réelles SWS, converties en devise de l'utilisateur via taux de change statiques)
  - **Modèle de kart** : dropdown multi-sélection
  - **Durée de roulage min** : slider (ex: 20 min minimum)
  - **Places disponibles** : toggle "masquer les courses complètes"
  - **Type de piste** : indoor / outdoor / tous
  - **Recherche texte** : nom de circuit ou ville
- Les filtres mettent à jour la carte ET la liste en temps réel
- URL avec query params reflétant les filtres (partage de lien filtré possible dès V1)
- Complexité : **M**

### F5. Géolocalisation et adresse de départ
- Demande de géolocalisation au premier accès (API Geolocation du navigateur)
- Fallback : champ de saisie d'adresse/ville/code postal avec autocomplétion
- Adresse sauvegardée en `localStorage`
- Utilisée pour : calcul des distances, tri par proximité, centrage de la carte
- Complexité : **S**

### F6. Internationalisation (i18n)
- Architecture i18n en place dès le MVP
- Langues V1 : Français (défaut), English
- Détection automatique de la langue du navigateur + sélecteur manuel
- URLs localisées : `/fr/carte`, `/en/map`
- Fichiers JSON de traduction par locale (via `next-intl`)
- Formatage localisé : dates, distances (km partout)
- Les données SWS (noms de circuits/courses) restent dans leur langue d'origine
- Langues V2 : Italien, Allemand, Espagnol
- Complexité : **M**

### F7. Responsive design (mobile-first)
- Breakpoints : mobile (< 768px), tablette (768–1024px), desktop (> 1024px)
- **Mobile** : carte plein écran + bottom sheet à 3 états :
  - Peek (25%) : compteur de résultats + filtres actifs
  - Half (50%) : liste scrollable des courses
  - Full (90%) : liste + filtres complets, carte réduite
- **Tablette** : layout desktop avec panneau latéral en overlay (toggle)
- **Desktop** : carte + panneau latéral fixe 380px
- Complexité : **M**

### F8. Pipeline de données SWS
- **Exécution via GitHub Actions** (pas Vercel Cron — les serverless functions Vercel Hobby ont un timeout de 60s max, insuffisant pour le scraping de dizaines de pages)
- CRON hebdomadaire : fetch `tracks/get_marker` → JSON statique des 781 circuits
- CRON quotidien en 2 étapes :
  1. Scraping calendrier HTML `/races/YYYY/MM` (mois courant + mois+1 + mois+2) → liste des courses
  2. Scraping fiches course individuelles → données enrichies (prix, places, durée, kart, etc.)
- Scraping incrémental : seules les nouvelles courses sont scrapées. Les courses < 48h sont re-scrapées pour mettre à jour les places restantes
- **Script de backfill initial** : scraping complet des 3 prochains mois (~300-500 fiches course), exécuté une seule fois avec rate limiting (1 req/s, ~10-20 min d'exécution)
- Matching circuit ↔ courses : slug URL en primaire + **fallbacks** (nom de ville, référence circuit type `FR-ACT`, coordonnées GPS) pour les cas de renommage. Log d'alerte pour les courses non matchées.
- Toutes les requêtes avec User-Agent Googlebot
- **Stockage** : les GitHub Actions commitent et pushent les JSON mis à jour dans le repo → Vercel rebuild automatique (ISR).
  - Les commits automatiques utilisent `--amend` + `--force-push` sur une branche dédiée `data` pour éviter de polluer l'historique git (1 seul commit "data: update" toujours réécrit).
  - La branche `main` merge `data` via un workflow de deploy, ou bien Vercel écoute la branche `data` directement.
  - Alternative si le volume grandit : Vercel Blob Storage (pas de rebuild nécessaire, les JSON sont servis via URL).
- ~5-8 requêtes/jour vers SWS en régime permanent (très raisonnable)
- **Gestion multi-devises** : le prix est stocké avec sa devise d'origine (EUR, GBP, PLN, CHF...). Conversion affichée côté client via taux de change statiques mis à jour mensuellement.
- Complexité : **L**

---

## 2.3 V2 — Fonctionnalités premium & communautaires

### F9. Estimation du budget déplacement (Premium)
- L'utilisateur renseigne son adresse de départ (sauvée en localStorage / compte)
- Pour chaque circuit/course, panneau "Budget déplacement" :
  - 🚗 **Voiture** : distance route, durée, coût carburant, estimation péages
  - 🚆 **Train** : durée estimée, fourchette de prix, lien Trainline
  - ✈️ **Avion** : affiché si > 500 km, fourchette de prix, lien Kiwi/Skyscanner
  - 🚗👥 **Covoiturage** : coût voiture ÷ nb personnes, lien BlaBlaCar
  - 🏨 **Hébergement** : 3 gammes (budget/moyen/premium), lien Booking
  - 💰 **Total estimé** : inscription (prix réel SWS) + transport + hébergement
- Paramètres personnalisables : conso véhicule, type carburant, nb personnes, avec/sans hébergement
- Cache agressif : une paire origine-destination est cachée 7 jours
- Complexité : **XL**

### F10. Filtre par budget total max (Premium)
- Slider "Budget max tout compris" : 50–500 €
- Filtre les courses où le coût estimé (transport + hébergement) est sous le seuil
- **Stratégie pour éviter l'explosion de requêtes ORS :**
  - Ne PAS calculer le routing pour chaque course visible en temps réel
  - Utiliser la **distance à vol d'oiseau × 1.3** (coefficient de détour routier) comme estimation rapide pour le pré-filtre
  - Le routing ORS réel n'est appelé que quand l'utilisateur **clique sur une course** (panneau budget détaillé)
  - Cache côté serveur (Redis ou fichier) des paires ville-de-départ → circuit déjà calculées (TTL 7 jours)
  - Pré-calcul en batch (GitHub Actions hebdomadaire) des distances routières depuis les 20 plus grandes villes européennes vers les 781 circuits — couvre la majorité des utilisateurs
- Complexité : **L**

### F11. Météo prévisionnelle (Gratuit basique / Premium détaillé)
- **Gratuit** : icône météo synthétique sur chaque marqueur de carte et fiche course (☀️🌤️🌧️)
- **Premium** : prévisions complètes (température, % pluie, vent, humidité) + données climatiques au-delà de 14 jours
- Logique à deux niveaux :
  - Course < 14 jours : Open-Meteo forecast API
  - Course > 14 jours : moyennes climatiques NASA POWER (pré-calculées)
- Filtre "courses au sec" / "courses par beau temps"
- Cache : prévisions 6h, données climatiques permanentes
- Complexité : **M**

### F12. Système de notation des circuits (Premium pour poster / Gratuit pour lire)
- Notation multi-critères (1-5 étoiles) :
  - Qualité piste, qualité karts, organisation, infrastructures, rapport qualité/prix, ambiance, restauration
- Note globale calculée (moyenne)
- Avis textuels avec date de visite, photos optionnelles
- Note moyenne visible sur les marqueurs et listings
- Modération : signalement par les utilisateurs
- Anti-abus : 1 avis par circuit par utilisateur (modifiable)
- Complexité : **L**

### F13. Tableau de bord personnel (Premium)
- Prochaines courses (inscrit ou favoris), avec météo et budget
- Résumé saison : nb courses, budget, distance parcourue
- Suggestions personnalisées (circuits pas encore visités, proches, dans le budget)
- Flux d'activité récent
- Complexité : **L**

### F14. Authentification utilisateur
- OAuth : Google + email/mot de passe
- Stockage : Supabase Auth (gratuit)
- Profil utilisateur minimal : nom, adresse par défaut, préférences (langue, conso véhicule)
- Complexité : **M**

### F15. Système d'abonnement premium
- Stripe Checkout + Billing Portal
- Plans : 5 €/mois ou 39 €/an
- Webhooks Stripe → Supabase pour gérer le statut
- Période d'essai : 14 jours gratuits
- **Mécanique "avis contre premium"** :
  - 7 jours de premium offerts par avis **détaillé et validé** (note multi-critères complète + texte ≥ 100 caractères + date de visite)
  - Maximum 2 avis récompensés par mois (= max 14 jours gratuits/mois)
  - L'avis doit passer la modération avant de créditer les jours premium
  - **Objectif** : à 5 €/mois, un utilisateur actif qui poste 2 avis/mois obtient ~50 % de remise effective, ce qui reste rentable pour bootstrapper le contenu communautaire
  - Les avis offerts sont cumulables avec un abonnement actif (prolonge la date d'expiration)
  - Plafond à vie : après 24 avis récompensés (~6 mois de premium gratuit), la mécanique s'arrête → conversion vers l'abonnement payant
- Page pricing comparative gratuit vs premium
- Complexité : **L**

### F16. Favoris et alertes
- Circuit ou type de course en favoris
- Alertes configurables : distance max, catégorie, jours préférés, budget max, circuits favoris
- Notifications email (Resend free tier : 3 000 emails/mois)
- Notifications in-app (pastille sur le dashboard)
- CRON de matching : nouvelles courses vs profils d'alertes
- Complexité : **L**

### F17. Profil Groundhopping — Socle (V2)
- Carte personnelle des circuits visités (cochés en couleur, non-visités grisés)
- Compteur groundhopping : circuits visités, pays visités, courses disputées
- Saisie manuelle des courses passées (circuit + date)
- URL publique du profil (SEO-friendly, SSR)
- Complexité : **L**

---

## 2.4 V3 — Fonctionnalités avancées

### F17b. Profil Groundhopping — Complet (V3)
- Statistiques avancées : km parcourus, podiums, budget total
- Heatmap d'activité (type GitHub contributions)
- Badges gamifiés : Rookie, Local Hero, Explorateur, Globetrotter, Marathonien, Assidu...
- Badges progressifs bronze/argent/or
- Classements : top groundhoppers global + par région
- Comparaison avec amis
- Import depuis SWS (si données accessibles)
- Résumé annuel partageable (façon Spotify Wrapped)
- Complexité : **XL**

### F18. Vue calendrier
- Complément de la carte : vue mensuelle des courses
- Synchronisée avec les mêmes filtres
- Complexité : **M**

### F19. Road trip karting
- Sélection de plusieurs courses sur un weekend/semaine
- Itinéraire optimisé (TSP simplifié)
- Budget total du road trip
- Complexité : **XL**

### F20. Comparateur de trajets
- Voiture vs train vs avion côte à côte pour un circuit donné
- Temps, coût, empreinte CO2
- Complexité : **M**

### F21. Notifications push navigateur
- Web Push API
- Complément des emails
- Complexité : **S**

### F22. Mode sombre
- Toggle clair/sombre
- Persisté en localStorage
- Complexité : **S**

---

## 2.5 Matrice de priorisation

| # | Fonctionnalité | Version | Complexité | Priorité | Gratuit/Premium |
|---|---------------|---------|-----------|----------|-----------------|
| F1 | Carte interactive (MapLibre) | V1 | M | Critique | Gratuit |
| F2 | Fiche circuit (SSG) | V1 | S | Critique | Gratuit |
| F3 | Liste des courses + fiches course SSG | V1 | M | Critique | Gratuit |
| F4 | Filtres combinables | V1 | M | Critique | Gratuit |
| F5 | Géolocalisation | V1 | S | Critique | Gratuit |
| F6 | i18n (FR/EN) | V1 | M | Critique | Gratuit |
| F7 | Responsive mobile + a11y | V1 | M | Critique | Gratuit |
| F8 | Pipeline SWS (GitHub Actions) | V1 | L | Critique | — |
| F9 | Budget déplacement | V2 | XL | Haute | Premium |
| F10 | Filtre budget max (distance haversine en pré-filtre) | V2 | L | Haute | Premium |
| F11 | Météo | V2 | M | Haute | Mixte |
| F12 | Notation circuits | V2 | L | Haute | Mixte |
| F14 | Auth utilisateur | V2 | M | Haute | — |
| F15 | Abonnement Stripe | V2 | L | Haute | — |
| F17 | Groundhopping socle (carte + compteur) | V2 | L | Haute | Premium |
| F13 | Dashboard perso | V2 | L | Moyenne | Premium |
| F16 | Favoris & alertes | V2 | L | Moyenne | Premium |
| F17b | Groundhopping complet (badges, classements, Wrapped) | V3 | XL | Moyenne | Premium |
| F18 | Vue calendrier | V3 | M | Basse | Gratuit |
| F19 | Road trip | V3 | XL | Basse | Premium |
| F20 | Comparateur trajets | V3 | M | Basse | Premium |
| F21 | Push notifications | V3 | S | Basse | Premium |
| F22 | Mode sombre | V3 | S | Basse | Gratuit |

---

# Phase 3 — Architecture technique

## 3.1 Stack technologique

### Frontend : Next.js 14+ (App Router)

**Justification :**
- **SSR/SSG** : les pages circuits/courses doivent être indexables (SEO multilingue). Next.js excelle ici avec `generateStaticParams` + ISR (Incremental Static Regeneration).
- **App Router** : routing natif avec layouts imbriqués, parfait pour le pattern `/{locale}/map`, `/{locale}/circuit/{slug}`.
- **React** : écosystème le plus riche pour les composants cartographiques (react-map-gl, react-leaflet).
- **next-intl** : solution i18n mature, intégrée à l'App Router, routage par locale natif.
- **Server Components** : réduction du JS envoyé au client, chargement plus rapide des données statiques.
- **Edge Runtime** : les API routes peuvent tourner en edge (Vercel Edge Functions), latence basse partout dans le monde.

**Alternatives considérées :**
- Nuxt.js (Vue) : excellent aussi mais écosystème cartographique React plus riche, et React a une base de développeurs plus large.
- Astro : bon pour le contenu statique mais moins adapté à l'interactivité carte temps réel.

### Carte : MapLibre GL JS (via react-map-gl)

**Justification :**
- Fork open source de Mapbox GL JS v1 (créé quand Mapbox est passé de BSD à licence propriétaire ; MapLibre reste BSD)
- Performances identiques à Mapbox (WebGL, vector tiles, 60fps)
- Tuiles gratuites via **MapTiler free tier** (100K requêtes/mois) ou **Protomaps** (self-hosted)
- Pas de contrainte ToS comme Google Maps
- Clustering natif, popups, géolocalisation intégrée
- **react-map-gl** de Uber/Vis.gl : wrapper React mature

### Backend / API : Next.js API Routes + GitHub Actions

- Pas de backend séparé au MVP — les API routes Next.js suffisent
- Données statiques servies depuis des fichiers JSON dans `/public/data/` (committés dans le repo, mis à jour par GitHub Actions)
- API routes pour : géocodage inverse, estimation transport (appels ORS cachés), proxy météo
- **GitHub Actions pour les pipelines SWS** (et non Vercel Cron — le timeout de 10s des serverless Vercel Hobby est insuffisant pour le scraping). GitHub Actions offre 2000 min/mois gratuitement sur repos privés, timeout jusqu'à 6h par job.
- Après chaque mise à jour des JSON par GitHub Actions, le push déclenche automatiquement un rebuild Vercel (ISR)

### Base de données : Aucune (MVP) → Supabase (V2)

- **MVP** : fichiers JSON statiques générés par les crons. Pas de BDD.
- **V2** : Supabase (PostgreSQL) pour : utilisateurs, avis, favoris, abonnements, notifications
  - Free tier : 500 MB stockage, 2 GB transfert, Auth illimité
  - Row Level Security pour la sécurité des données utilisateur
  - Realtime pour les notifications in-app

### Hébergement : Vercel (plan Hobby gratuit)

- Build + déploiement automatique depuis GitHub (auto-rebuild quand les GitHub Actions pushent les JSON mis à jour)
- CDN mondial (edge network)
- Serverless functions pour les API routes (proxy ORS, météo)
- Analytics basiques gratuits (privacy-friendly, pas de cookies)
- Domaines custom : karthopper.com (principal) + karthopper.fr (redirect)

### Paiement : Stripe

- Checkout Sessions pour l'inscription premium
- Customer Portal pour la gestion d'abonnement
- Webhooks → API route Next.js → mise à jour Supabase

---

## 3.2 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KARTHOPPER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │                    FRONTEND (Next.js)                     │       │
│  │                                                           │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │       │
│  │  │ MapView  │  │ RaceList │  │ Filters  │  │ i18n    │ │       │
│  │  │(MapLibre)│  │ (Panel)  │  │ (Bar)    │  │(next-   │ │       │
│  │  │          │  │          │  │          │  │ intl)   │ │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │       │
│  │  │ Circuit  │  │ Budget   │  │ Weather  │              │       │
│  │  │ Detail   │  │ Panel    │  │ Widget   │              │       │
│  │  │          │  │ (V2)     │  │ (V2)     │              │       │
│  │  └──────────┘  └──────────┘  └──────────┘              │       │
│  └─────────────────────────────────────────────────────────┘       │
│                              │                                      │
│                    ┌─────────▼──────────┐                           │
│                    │   API Routes       │                           │
│                    │   (Next.js)        │                           │
│                    │                    │                           │
│                    │ /api/geocode       │                           │
│                    │ /api/route         │──── OpenRouteService      │
│                    │ /api/weather       │──── Open-Meteo            │
│                    │ /api/stripe/*      │──── Stripe (V2)           │
│                    └────────────────────┘                           │
│                              │                                      │
│  ┌───────────────────────────▼──────────────────────────────┐      │
│  │              DATA LAYER                                    │      │
│  │                                                            │      │
│  │  ┌─────────────────┐    ┌──────────────────────┐         │      │
│  │  │ Static JSON     │    │ Supabase (V2)        │         │      │
│  │  │                 │    │                      │         │      │
│  │  │ circuits.json   │    │ users                │         │      │
│  │  │ races.json      │    │ reviews              │         │      │
│  │  │ climate.json    │    │ favorites            │         │      │
│  │  │                 │    │ subscriptions        │         │      │
│  │  └─────────────────┘    │ notifications        │         │      │
│  │                         └──────────────────────┘         │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │              CRON JOBS (GitHub Actions)                     │      │
│  │                                                            │      │
│  │  ┌──────────────┐   ┌──────────────┐  ┌──────────────┐  │      │
│  │  │ Weekly       │   │ Daily        │  │ One-time     │  │      │
│  │  │ (dim 3h UTC) │   │ (5h UTC)     │  │ (manuel)     │  │      │
│  │  │              │   │              │  │              │  │      │
│  │  │ SWS circuits │   │ SWS races    │  │ NASA POWER   │  │      │
│  │  │ get_marker   │   │ calendrier + │  │ climate data │  │      │
│  │  │ → circuits   │   │ fiches course│  │ → climate    │  │      │
│  │  │   .json      │   │ → races.json │  │   .json      │  │      │
│  │  └──────┬───────┘   └──────┬───────┘  └──────────────┘  │      │
│  │         │                  │                              │      │
│  │         ▼                  ▼                              │      │
│  │    sodiwseries.com (Googlebot UA)                        │      │
│  │         │                  │                              │      │
│  │         └───── git push ───┘ → Vercel auto-rebuild       │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3.3 Pipeline de données SWS

### Pipeline circuits (hebdomadaire)

```
GitHub Actions — cron: "0 3 * * 0" (dimanche 3h00 UTC)
  │
  ▼
Checkout du repo + npm install (cacheable)
  │
  ▼
Exécute : npx tsx scripts/fetch-circuits.ts
  │
  GET https://www.sodiwseries.com/en-gb/tracks/get_marker
    Headers: User-Agent: Googlebot, X-Requested-With: XMLHttpRequest
  │
  ▼
  Réponse JSON (471 KB, 781 circuits)
  │
  ▼
  Transformation :
    - Nettoyage des données (trim, normalisation)
    - Génération de slugs pour les URLs KartHopper
    - Ajout de champs dérivés : région (à partir du pays)
    - Ajout de la devise probable par pays (EUR, GBP, PLN, CHF...)
  │
  ▼
  Écriture : /public/data/circuits.json
  │
  ▼
Git commit + push (si diff) → déclenche rebuild Vercel automatique
```

### Pipeline courses (quotidien) — 2 étapes

```
GitHub Actions — cron: "0 5 * * *" (tous les jours 5h00 UTC)
  │
  ▼
Checkout du repo + npm install (cacheable)
  │
  ▼
Exécute : npx tsx scripts/scrape-races.ts
  │
  ▼
ÉTAPE 1 : Scraping calendrier (liste des courses)
  │
  Scraping multilingue :
    - Courses françaises (country_iso === "fr") → locale fr-fr
    - Toutes les autres courses → locale en-gb
  │
  GET https://www.sodiwseries.com/{locale}/races/YYYY/MM  (mois courant)
  GET https://www.sodiwseries.com/{locale}/races/YYYY/MM  (mois+1)
  GET https://www.sodiwseries.com/{locale}/races/YYYY/MM  (mois+2)
    Headers: User-Agent: Googlebot
    Délai : 1s entre chaque requête
  │
  Note : le calendrier est scrappé en en-gb (listing mondial).
  Les fiches individuelles sont scrappées dans la locale du pays.
  │
  ▼
  Parse HTML calendrier :
    - Extraction des <tr data-rowlink="...">
    - Titre, catégorie (CSS class), date, URL de la fiche course
    - Extraction du slug circuit depuis l'URL
  │
  ▼
ÉTAPE 2 : Scraping fiches course individuelles (données enrichies)
  │
  Pour chaque course NOUVELLE ou NON ENCORE SCRAPÉE :
    Déterminer la locale : circuit.country_iso === "fr" → fr-fr, sinon → en-gb
    GET https://www.sodiwseries.com/{locale}/races/{circuit-slug}/{course-slug}-{id}.html
      Headers: User-Agent: Googlebot
      Délai : 1s entre chaque requête (rate limiting)
  │
  ▼
  Parse HTML fiche course :
    - Prix d'inscription + devise (EUR, GBP, PLN, CHF...)
    - Places prises / places totales
    - Date limite d'inscription
    - Modèle de kart
    - Timing (durée de chaque manche → durée de roulage totale)
    - Type de piste (indoor/outdoor)
    - Lest (oui/non)
    - Commentaires / infos complémentaires
    - Référence SWS
  │
  ▼
Matching circuit (multi-stratégie, par ordre de priorité) :
  1. Slug URL course → correspondance avec circuit.slug
  2. Fallback : nom de ville / référence circuit (ex: FR-ACT)
  3. Fallback : coordonnées GPS si disponibles
  4. Si aucun match → log WARNING + ajout dans un fichier unmatched.json pour review manuelle
  │
  ▼
Enrichissement : ajout des coordonnées GPS du circuit parent
  │
  ▼
Écriture : /public/data/races.json
  │
  ▼
Git commit + push (si diff) → rebuild Vercel automatique

Estimation du volume de requêtes (régime permanent) :
  - Calendrier : 3 pages/jour
  - Fiches course : ~50-150 nouvelles courses/mois → ~2-5 fiches/jour en moyenne
  - Re-scrape des courses < 48h : ~5-10 fiches/jour
  - Total : ~10-18 requêtes/jour vers SWS (très raisonnable)
```

### Script de backfill initial (one-shot)

```
Exécuté manuellement lors du premier déploiement :
  npx tsx scripts/backfill-races.ts

  - Scrape les 3 prochains mois complets (~300-500 fiches course)
  - Rate limiting : 1 requête/seconde (soit ~5-8 min pour 300 courses)
  - Timeout : 20 min max
  - Sauvegarde incrémentale (toutes les 50 courses → écriture intermédiaire)
  - En cas d'interruption : reprend là où il s'est arrêté (basé sur les courses déjà dans races.json)
  - Produit le fichier races.json initial complet
```

### Pipeline climat (one-shot + mise à jour annuelle)

```
Script Node.js exécuté manuellement (ou GitHub Action annuel)
  │
  ▼
Pour chaque circuit (781) :
  GET https://power.larc.nasa.gov/api/temporal/monthly/point
    ?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,WS2M
    &community=RE
    &longitude={lng}&latitude={lat}
    &start=2001&end=2023
    &format=JSON
  │
  ▼
Calcul des moyennes par mois :
  - Température moyenne, min, max
  - Précipitations mensuelles moyennes
  - Vitesse du vent moyenne
  - Estimation jours de pluie (précipitations > 1mm)
  │
  ▼
Écriture : /public/data/climate.json
  Structure : { "circuit_id": { "1": { temp: 5.2, rain_mm: 45, ... }, "2": { ... }, ... "12": { ... } } }
```

---

## 3.4 Stratégie de cache multi-niveaux

| Donnée | Source | Fréquence de refresh | Durée de cache | Stockage |
|--------|--------|----------------------|----------------|----------|
| Circuits (781) | SWS `get_marker` | 1×/semaine | 7 jours | JSON statique (`circuits.json`) |
| Courses (calendrier + fiches) | SWS HTML scraping | 1×/jour + re-scrape < 48h | 24h | JSON statique (`races.json`) |
| Climat par circuit | NASA POWER | 1×/an | Permanent | JSON statique (`climate.json`) |
| Prévisions météo | Open-Meteo | À la demande | 6h | API route + en-tête `Cache-Control` |
| Itinéraire voiture | OpenRouteService | À la demande | 7 jours | `localStorage` côté client + API cache |
| Estimation transport | Calcul interne | À la demande | 7 jours | `localStorage` côté client |
| Prix hébergement | Heuristique | Statique | Permanent | Inclus dans le code (coefficients) |
| Géocodage adresse | Nominatim / Photon | À la demande | 30 jours | `localStorage` |

**Estimation taille `races.json`** : chaque fiche course enrichie (prix, places, durée, kart, commentaires texte libre, timing) pèse ~800-1500 octets en JSON (le champ commentaires peut être long). Pour 3 mois de courses (~300-500 courses), le fichier fait **~250-750 KB**. Reste chargeable côté client sans problème (compressé gzip : ~60-150 KB).

**Côté client :** les fichiers `circuits.json` (471 KB → ~90 KB gzip) et `races.json` (~250-750 KB → ~60-150 KB gzip) sont chargés une seule fois et cachés via `Cache-Control: max-age=86400, stale-while-revalidate=3600`. Le client filtre et affiche en local — pas d'appels API pour le browsing de base.

**Migration tuiles carte** : si le free tier MapTiler (100K requêtes/mois) est dépassé, migrer vers **Protomaps** (PMTiles self-hosted sur Cloudflare R2 ou Vercel Blob). Coût : ~0.50 $/mois pour le stockage, bande passante quasi gratuite via CDN. La migration est transparente pour le code (même format vector tiles, juste changer l'URL source dans MapLibre).

---

## 3.5 Structure du projet

```
karthopper/
├── public/
│   └── data/
│       ├── circuits.json          # 781 circuits (généré par cron)
│       ├── races.json             # Courses à venir (généré par cron)
│       └── climate.json           # Moyennes climatiques (généré one-shot)
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── layout.tsx         # Layout avec i18n provider
│   │   │   ├── page.tsx           # Landing page hero + CTA
│   │   │   ├── map/
│   │   │   │   └── page.tsx       # Page carte principale
│   │   │   ├── circuit/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # Fiche circuit (SSG, 781 pages)
│   │   │   ├── course/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx   # Fiche course (SSG, JSON-LD Event)
│   │   │   ├── mentions-legales/
│   │   │   │   └── page.tsx       # Mentions légales
│   │   │   ├── confidentialite/
│   │   │   │   └── page.tsx       # Politique de confidentialité
│   │   │   └── pricing/
│   │   │       └── page.tsx       # Page pricing (V2)
│   │   └── api/
│   │       ├── route/
│   │       │   └── route.ts       # Proxy ORS avec cache
│   │       ├── weather/
│   │       │   └── route.ts       # Proxy Open-Meteo avec cache
│   │       └── stripe/
│   │           └── webhook/
│   │               └── route.ts   # Webhook Stripe (V2)
│   ├── components/
│   │   ├── map/
│   │   │   ├── MapView.tsx        # Composant carte principal
│   │   │   ├── CircuitMarker.tsx  # Marqueur circuit
│   │   │   └── ClusterLayer.tsx   # Couche de clustering
│   │   ├── races/
│   │   │   ├── RaceList.tsx       # Liste des courses
│   │   │   ├── RaceCard.tsx       # Carte individuelle d'une course
│   │   │   └── RaceFilters.tsx    # Barre de filtres
│   │   ├── circuit/
│   │   │   ├── CircuitDetail.tsx  # Panneau détail circuit
│   │   │   └── CircuitPhoto.tsx   # Photo avec lazy loading
│   │   ├── budget/               # V2
│   │   │   ├── BudgetPanel.tsx
│   │   │   └── TransportEstimate.tsx
│   │   ├── weather/              # V2
│   │   │   ├── WeatherBadge.tsx
│   │   │   └── WeatherDetail.tsx
│   │   └── ui/                   # Composants génériques
│   │       ├── Slider.tsx
│   │       ├── DatePicker.tsx
│   │       └── MultiSelect.tsx
│   ├── lib/
│   │   ├── sws/
│   │   │   ├── fetchCircuits.ts   # Fetch + parse get_marker
│   │   │   ├── scrapeRaces.ts     # Scrape calendrier + fiches course (prix, places, durée...)
│   │   │   └── matchCircuit.ts    # Matching course ↔ circuit
│   │   ├── transport/
│   │   │   ├── routing.ts         # Client ORS
│   │   │   ├── fuelCost.ts        # Calcul coût carburant
│   │   │   ├── tollEstimate.ts    # Estimation péages heuristique
│   │   │   └── trainEstimate.ts   # Estimation train heuristique
│   │   ├── weather/
│   │   │   ├── forecast.ts        # Client Open-Meteo
│   │   │   └── climate.ts         # Lecture données climatiques
│   │   ├── geo/
│   │   │   ├── distance.ts        # Haversine + utils géo
│   │   │   └── geocode.ts         # Géocodage (Nominatim/Photon)
│   │   └── utils/
│   │       ├── cache.ts           # Utilitaires de cache
│   │       └── formatting.ts      # Formatage localisé (dates, distances, €)
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useFilters.ts
│   │   └── useCircuits.ts
│   ├── store/
│   │   └── filters.ts             # État global des filtres (Zustand)
│   ├── messages/
│   │   ├── fr.json                # Traductions FR
│   │   ├── en.json                # Traductions EN
│   │   ├── it.json                # V2
│   │   ├── de.json                # V2
│   │   └── es.json                # V2
│   └── types/
│       ├── circuit.ts             # Circuit SWS (id, name, lat, lng, country, ...)
│       ├── race.ts                # Course SWS (id, circuit_id, date, price, currency, places, kart, timing, ...)
│       └── weather.ts             # Prévisions + données climatiques
├── scripts/
│   ├── fetch-circuits.ts          # Script standalone fetch circuits (GitHub Actions weekly)
│   ├── scrape-races.ts            # Script standalone scrape courses (GitHub Actions daily)
│   ├── backfill-races.ts          # Script one-shot backfill initial des courses
│   └── fetch-climate.ts           # Script one-shot données climatiques NASA POWER
├── .github/
│   └── workflows/
│       ├── fetch-circuits.yml     # Cron hebdomadaire : dimanche 3h UTC
│       └── scrape-races.yml       # Cron quotidien : 5h UTC
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 3.6 Choix technologiques détaillés

| Couche | Technologie | Justification |
|--------|------------|---------------|
| Framework | Next.js 14+ (App Router) | SSR/SSG, API routes, i18n, ISR, écosystème React |
| Langage | TypeScript | Typage strict, refactoring sûr, DX |
| Carte | MapLibre GL JS + react-map-gl | Open source, performant (WebGL), gratuit |
| Tuiles carte | MapTiler free tier (100K/mois) | Styles variés, bon free tier. Fallback : Protomaps |
| CSS | Tailwind CSS | Utility-first, responsive facile, bundle petit |
| Composants UI | shadcn/ui | Composants accessibles, customisables, pas de vendor lock-in |
| État global | Zustand | Léger (1 KB), simple, pas de boilerplate Redux |
| i18n | next-intl | Intégré App Router, routing par locale, Server Components |
| Scraping HTML | cheerio | Parse HTML rapide, pas de navigateur headless nécessaire |
| HTTP client | undici (Node) / fetch (browser) | Natif, performant |
| Géocodage | Photon (par Komoot) | Gratuit, basé OSM, pas de clé API, global |
| Icônes | Lucide React | Open source, tree-shakeable, cohérent |
| Formulaires | React Hook Form + Zod | Validation typée, performant |
| Auth (V2) | Supabase Auth | Gratuit, OAuth Google, magic links |
| BDD (V2) | Supabase PostgreSQL | Free tier généreux, RLS, realtime |
| Paiement (V2) | Stripe | Standard, bien documenté, Europe |
| Email (V2) | Resend | 3 000 emails/mois gratuits, DX excellent |
| Hébergement | Vercel Hobby (gratuit) | CDN mondial, serverless, cron, preview deploys |
| CI/CD + Crons | GitHub Actions | Illimité (repo public). Pipelines SWS + déploiement |
| Monitoring | Vercel Analytics + Sentry free tier | Erreurs + performance |

---

## 3.7 Plan de développement par étapes

### Sprint 0 — Setup + DA (2-3 jours) — Complexité S
- Init projet Next.js + TypeScript + Tailwind + shadcn/ui
- **Direction artistique** : installer les fonts via `next/font` (Space Grotesk + Inter), configurer le `tailwind.config.ts` avec la palette KartHopper (couleurs kart-50 à kart-900, sémantiques sprint/endurance/junior), configurer shadcn/ui avec le thème custom (primary = kart-500)
- Créer le composant Badge générique (catégorie, statut)
- Favicon placeholder (pin orange)
- Config i18n (next-intl) avec FR/EN
- Config routing `[locale]/`
- Déploiement initial sur Vercel
- Domaines karthopper.com + karthopper.fr configurés

### Sprint 1 — Pipeline SWS + Données (3-5 jours) — Complexité L
- Script `fetch-circuits.ts` : appel `get_marker`, sauvegarde `circuits.json`
- Script `scrape-races.ts` : scraping HTML calendrier, parse, matching circuit
- Script `fetch-climate.ts` : batch NASA POWER → `climate.json`
- Tests unitaires sur le parsing HTML et le matching
- Premier run : générer les 3 fichiers JSON de données

### Sprint 2 — Carte interactive (5-7 jours) — Complexité M
- Composant MapView avec MapLibre GL JS
- Chargement et affichage des 781 circuits avec clustering
- Géolocalisation navigateur + champ adresse (Photon)
- Popup basique au clic sur un marqueur
- Responsive : plein écran mobile, 70% desktop

### Sprint 3 — Liste des courses + Filtres (5-7 jours) — Complexité M
- Panneau latéral avec la liste des courses
- Fiche circuit au clic (panneau ou modale)
- Filtres : distance, dates, pays, catégorie, recherche texte
- Synchronisation carte ↔ liste
- URL avec query params pour partage de filtres
- Tri par date / distance

### Sprint 4 — Pages SEO + Accessibilité + Polish MVP (3-5 jours) — Complexité M
- Pages `/[locale]/circuit/[slug]` en SSG (781 pages pré-rendues)
- Pages `/[locale]/course/[slug]` en SSG (toutes les courses à venir — pré-rendues via `generateStaticParams` depuis `races.json`)
  - SEO : "Course karting sprint à Lyon le 21 mars 2026 — 90 € — 21 places restantes"
  - Structured data JSON-LD (`Event` schema) pour les rich snippets Google
- SEO : meta tags, Open Graph, sitemap multilingue (circuits + courses)
- **Accessibilité (a11y)** :
  - Navigation clavier complète sur la carte et les filtres
  - Rôles ARIA sur les composants interactifs (filtres, liste, popups)
  - Labels sur les sliders et selects
  - Contrastes AA minimum (vérification automatique via axe-core dans les tests)
  - Mode lecteur d'écran : les données clés de chaque course sont lisibles en texte
- Performance : lazy loading images, optimisation bundle
- Landing page (`/[locale]`) avec hero + CTA
- Tests E2E (Playwright) sur les parcours critiques
- **→ LANCEMENT MVP** 🚀

### Sprint 5 — Auth + Abonnement (5-7 jours) — Complexité L
- Supabase Auth (Google OAuth + email/password)
- Stripe Checkout + webhooks
- Middleware de vérification premium
- Page pricing

### Sprint 6 — Budget déplacement (7-10 jours) — Complexité XL
- Intégration OpenRouteService (routing)
- Calcul carburant + estimation péages
- Estimations train/avion heuristiques + liens affiliés
- Estimation hébergement + lien Booking
- Panneau budget complet
- Filtre budget max
- Cache des trajets (localStorage + API)

### Sprint 7 — Météo + Notation (5-7 jours) — Complexité M+L
- Intégration Open-Meteo (prévisions)
- Affichage météo basique (icône sur marqueurs) + détaillé (panneau)
- Données climatiques au-delà de 14 jours (depuis `climate.json`)
- Système de notation multi-critères
- Formulaire d'avis
- Affichage notes sur les marqueurs et listings

### Sprint 8 — Dashboard + Notifications (5-7 jours) — Complexité L+L
- Tableau de bord personnel
- Système de favoris
- Configuration d'alertes
- CRON de matching nouvelles courses ↔ alertes
- Envoi emails (Resend)

### Sprint 9 — Groundhopping socle (5-7 jours) — Complexité L
- Carte personnelle des circuits visités (marqueurs colorés vs grisés)
- Compteurs : circuits visités, pays, courses
- Saisie manuelle des courses passées
- Page profil publique SSR (`/[locale]/profil/[username]`)
- **→ LANCEMENT V2** 🚀

### Sprints 10+ — V3 (estimation : 6-8 semaines)
- Profil groundhopping complet (XL)
- Vue calendrier (M)
- Road trip karting (XL)
- Comparateur de trajets (M)
- Langues supplémentaires : IT, DE, ES (S par langue)
- Push notifications (S)
- Mode sombre (S)
- Résumé annuel partageable (L)

---

## 3.8 Estimation de complexité globale

| Version | Sprints | Durée estimée* | Fonctionnalités |
|---------|---------|----------------|-----------------|
| MVP (V1) | Sprints 0-4 | 3-4 semaines | Carte, courses, filtres, i18n, responsive |
| V2 | Sprints 5-9 | 5-7 semaines | Auth, premium, budget, météo, avis, dashboard, groundhopping socle |
| V3 | Sprints 10+ | 6-8 semaines | Groundhopping complet, road trip, calendrier, notifications push |

*En mode développeur solo, à temps plein.

---

# Cadre légal et conformité

## RGPD (obligatoire — utilisateurs européens)

### Données personnelles collectées
| Donnée | Base légale | Durée de conservation |
|--------|-------------|----------------------|
| Adresse/ville de départ (localStorage) | Consentement | Jusqu'à suppression par l'utilisateur |
| Email + nom (compte V2) | Contrat (service premium) | Durée du compte + 3 ans |
| Préférences (conso véhicule, langue) | Consentement | Durée du compte |
| Avis et notes sur les circuits | Intérêt légitime (contenu UGC) | Durée du compte + 1 an |
| Données de paiement | Stripe gère le PCI-DSS, pas de stockage local | Selon Stripe |
| Adresse IP (logs serveur Vercel) | Intérêt légitime (sécurité) | 30 jours |

### Obligations à implémenter
- **Bannière de consentement cookies** : obligatoire dès la V1 (même si on n'utilise que localStorage, certaines juridictions l'exigent). Solution : cookie banner minimaliste, pas de tracking tiers au MVP.
- **Page mentions légales** : hébergeur (Vercel), éditeur (toi), contact
- **Page politique de confidentialité** : données collectées, durées, droits, contact DPO
- **Droit d'accès, de rectification, de suppression** (V2) : endpoint API pour export/suppression des données utilisateur
- **Pas de transfert hors-UE problématique** : Vercel a des edge nodes en Europe, Supabase peut être configuré en région EU, Stripe est conforme
- **Pas de profilage automatisé** décisionnel (les suggestions sont de la recommandation, pas du scoring)

### Cookies et trackers
- **V1** : zéro cookie tiers, zéro tracker. Uniquement localStorage pour les préférences.
- **V2** : Supabase Auth = 1 cookie de session. Stripe = cookies de paiement sur le domaine Stripe.
- **Analytics** : Vercel Analytics (privacy-friendly, pas de cookies) ou Plausible (open source, RGPD-compatible). **PAS de Google Analytics** (trop complexe RGPD).

## Scraping SWS — Aspects juridiques

- Le scraping de données publiquement accessibles est **légal en Europe** (arrêt CJUE C-355/12, directive 2019/1024 sur les données ouvertes)
- Le User-Agent Googlebot n'enfreint aucune loi — SWS autorise volontairement Googlebot pour son SEO
- **Mitigation** : lien vers sodiwseries.com sur chaque fiche circuit/course (attribution), pas de copie des photos en local (utilisation des URLs originales), respect du robots.txt pour les sections sensibles
- En cas de mise en demeure de SWS : retirer les données immédiatement, proposer un partenariat

## Conditions Générales d'Utilisation (CGU)

À rédiger avant le lancement V2 (quand les comptes utilisateurs arrivent) :
- Conditions d'utilisation du service gratuit et premium
- Règles de modération des avis (pas de diffamation, contenu pertinent, etc.)
- Politique de remboursement premium (14 jours de rétractation légale en EU)
- Propriété intellectuelle du contenu utilisateur (l'utilisateur garde ses droits, licence d'affichage à KartHopper)

---

# Stratégie de lancement

## Analyse concurrentielle

Il n'existe **aucun concurrent direct** offrant une carte interactive des courses de karting en location avec estimation budgétaire. Les alternatives actuelles :
- **sodiwseries.com** : source de données, mais UX de recherche géographique inexistante
- **Google Maps "karting near me"** : trouve les circuits mais pas les courses programmées ni les prix
- **Groupes Facebook locaux** : infos éparses, pas de recherche structurée
- **Applications karting (MyLaps, Apex Timing)** : chronométrage, pas de découverte de courses

**Avantage compétitif KartHopper** : première plateforme à croiser données géographiques + courses planifiées + estimation budgétaire.

## Stratégie d'acquisition utilisateurs

### Phase 1 — Lancement MVP (mois 1-2)
- **SEO** : 781 pages circuit + N pages course en SSG = forte indexation Google. Cibler les requêtes "course karting [ville]", "karting [pays]", "endurance karting [circuit]"
- **Reddit / forums karting** : posts dans r/karting, les forums nationaux (kartingmania.com FR, kartingmagazine.com UK, etc.)
- **Groupes Facebook** : partage dans les groupes de karting locaux (FR, IT, DE, PL, ES)
- **Produit Hunt** : lancement day-one pour visibilité développeur/tech

### Phase 2 — Croissance V2 (mois 3-6)
- **Contenu UGC** : mécanique "avis contre premium" pour bootstrapper les reviews
- **Réseaux sociaux** : compte Instagram/TikTok avec du contenu karting (vidéos de courses, infographies)
- **Partenariats circuits** : contacter les circuits SWS pour qu'ils partagent KartHopper avec leurs inscrits
- **Newsletter** : digest hebdomadaire des prochaines courses par région (via les emails collectés)

### Phase 3 — Rétention V3 (mois 6+)
- **Groundhopping** : effet viral du partage de profil ("j'ai visité 42 circuits dans 8 pays")
- **Wrapped annuel** : partage massif sur les réseaux en fin d'année

---

# Prochaines étapes concrètes

## Les 5 premières tâches à implémenter (dans l'ordre)

### 1. Initialiser le projet (Sprint 0)
```bash
npx create-next-app@latest karthopper --typescript --tailwind --app --src-dir
cd karthopper
npm install next-intl maplibre-gl react-map-gl zustand
npx shadcn-ui@latest init
```
- Configurer le `tailwind.config.ts` avec la palette DA (couleurs kart-50 à kart-900, sprint, endurance, junior, shadows custom)
- Installer les fonts via `next/font/google` : Space Grotesk (headings) + Inter (body)
- Configurer shadcn/ui avec le thème custom (primary = kart-500, radius = 8px)
- Créer le composant Badge générique (catégorie + statut)
- Favicon placeholder (pin orange SVG)
- Configurer `next-intl` avec routing `[locale]`
- Créer les fichiers de traduction `fr.json` et `en.json` (squelette)
- Déployer sur Vercel, brancher les domaines (karthopper.com + karthopper.fr)
- **Critère de succès :** `karthopper.com/fr` et `karthopper.com/en` affichent "KartHopper" avec les bonnes fonts et couleurs DA

### 2. Pipeline de données SWS (Sprint 1)
- Écrire `scripts/fetch-circuits.ts` (fetch `get_marker` avec Googlebot UA → `circuits.json`)
- Écrire `scripts/scrape-races.ts` (fetch HTML calendrier → parse avec cheerio → `races.json`)
- Écrire la logique de matching course ↔ circuit (slug URL → circuit ID)
- Exécuter les scripts, valider les données
- **Critère de succès :** `circuits.json` contient 781 entrées avec GPS, `races.json` contient les courses des 3 prochains mois avec circuit_id, prix, places, durée de roulage, modèle de kart

### 3. Carte interactive avec circuits (Sprint 2)
- Composant MapView avec MapLibre GL JS
- Charger `circuits.json`, afficher les marqueurs avec clustering
- Géolocalisation navigateur
- Popup basique au clic (nom, ville, pays, photo, lien SWS)
- **Critère de succès :** carte fonctionnelle avec 781 marqueurs, clustering fluide, popup au clic

### 4. Liste des courses + filtres (Sprint 3)
- Panneau latéral avec `RaceList` et `RaceCard`
- Charger `races.json`, afficher les courses triées par date
- Filtres : distance, dates, pays, catégorie
- Synchronisation carte ↔ liste
- **Critère de succès :** je peux filtrer les courses d'endurance à moins de 200 km de chez moi dans les 2 prochains mois

### 5. Données climatiques (en parallèle du Sprint 2-3)
- Écrire `scripts/fetch-climate.ts` (batch NASA POWER pour 781 circuits)
- Exécuter le script, générer `climate.json`
- **Critère de succès :** fichier JSON avec 781 entrées × 12 mois de données climatiques moyennes

---

## Risques à surveiller

| Risque | Probabilité | Surveillance | Action |
|--------|------------|-------------|--------|
| SWS change la structure HTML des pages courses | Moyenne | Test automatisé quotidien vérifiant le parsing (GitHub Actions) | Adapter le parser, alerter par email |
| SWS bloque le Googlebot UA | Très faible | Monitorer le HTTP status code des crons | Fallback Playwright + résolution captcha |
| MapTiler free tier dépassé (100K tuiles/mois) | Moyenne (dès ~3K users/mois) | Vercel Analytics + compteur | Migrer vers Protomaps (PMTiles sur Cloudflare R2) — migration transparente |
| OpenRouteService rate limit (2K/jour) | Faible (grâce au pré-filtre haversine) | Compteur dans l'API route | Cache plus agressif + pré-calcul batch des 20 grandes villes |
| Vercel Hobby limites (100 GB bandwidth) | Faible au MVP | Dashboard Vercel | Optimiser assets, ou passer Pro (20 $/mois) |
| GitHub Actions — dépassement quota | Non applicable (repo public = illimité) | — | — |
| Course non matchée à un circuit | Moyenne | Fichier `unmatched.json` + log WARNING | Review manuelle + amélioration des heuristiques de matching |

---

> **Résumé exécutif :** Le MVP est réalisable en 3-4 semaines avec un budget de 0 €/mois (100% free tiers : Vercel Hobby, GitHub Actions illimitées sur repo public, MapTiler, Open-Meteo, Photon). La stack Next.js + MapLibre + GitHub Actions + JSON statique est légère, performante et sans vendor lock-in. Les données SWS sont riches (prix, places, durée, kart — scrappées en fr-fr pour la France, en-gb pour le reste). La DA est calée (palette orange/slate, Space Grotesk + Inter, contraste WCAG AA vérifié). La V2 avec les fonctionnalités premium (budget déplacement, météo, avis, groundhopping socle, auth, Stripe) s'appuie sur Supabase gratuit et peut être monétisée à 5 €/mois. Le coût opérationnel reste sous 20 €/mois en V1 et sous 70 €/mois en V2. Domaines : karthopper.com + karthopper.fr. Aucun concurrent direct.
