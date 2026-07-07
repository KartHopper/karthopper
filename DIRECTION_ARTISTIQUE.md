# KartHopper — Direction Artistique

> Version 1.1 — 18 mars 2026 — Audit : corrections a11y contraste, focus states, optimisation fonts, états vides, formats

---

## 1. Positionnement & personnalité de marque

### Le pitch visuel
**"Strava pour la découverte de courses karting"** — un outil cartographique premium, data-rich, qui donne envie d'explorer et de collectionner les circuits. Sérieux dans les données, dynamique dans l'énergie.

### Personnalité
| Trait | Curseur | Justification |
|-------|---------|---------------|
| Sérieux ←→ Fun | 60% sérieux | C'est un outil de planification (budget, trajets) — l'utilisateur doit avoir confiance dans les données. Mais le karting reste un loisir, pas un outil B2B. |
| Minimaliste ←→ Dense | 65% dense | La carte + filtres + liste = beaucoup d'info à afficher. On assume la densité mais on la structure bien (comme Booking ou Airbnb). |
| Classique ←→ Moderne | 80% moderne | Public tech-savvy, habitué aux apps mobiles. Design contemporain, pas corporate. |
| Neutre ←→ Énergétique | 70% énergétique | Le karting c'est la vitesse, l'adrénaline. La DA doit transmettre cette énergie sans tomber dans le cliché "flammes et damiers". |

### Références visuelles (mood)
- **Strava** : la gamification, les badges, la carte d'activité, le ton sportif-but-clean
- **Komoot** : la carte interactive plein écran, les fiches circuits/itinéraires, le panneau latéral
- **Airbnb** : les cartes de listing avec photo + prix + note, la recherche cartographique
- **F1 App** : la palette sombre + accents vifs, la typographie sport-tech, les données de course
- **Spotify Wrapped** : l'inspiration pour le résumé annuel groundhopping (V3)

---

## 2. Palette de couleurs

### Philosophie
La palette est construite autour de 2 axes :
1. **Énergie** : un orange vif (la couleur la plus visible sur une carte, évoque la vitesse et le sport sans le cliché du rouge racing)
2. **Confiance** : un bleu nuit profond (crédibilité, lisibilité, contraste)

### Couleurs principales

```
ORANGE KARTING (Primary)
  #FF5A1F  — Orange vif, accent principal (boutons, marqueurs, CTA)
  #FF7A45  — Orange clair (hover states)
  #FFF1EB  — Orange pâle (backgrounds subtils, badges)

  ⚠️ ACCESSIBILITÉ : #FF5A1F sur blanc = ratio 4.0:1 → ÉCHOUE WCAG AA pour texte normal.
  → Utiliser #C23D0F (kart-700) pour tout texte orange sur fond blanc (ratio 6.2:1 → OK).
  → #FF5A1F reste utilisable pour : boutons (texte blanc sur orange = 4.6:1 OK),
    marqueurs, icônes, bordures, fonds.

BLEU NUIT (Secondary)
  #0F172A  — Slate 900 — texte principal, headers, nav
  #1E293B  — Slate 800 — texte secondaire, panneaux
  #334155  — Slate 700 — texte tertiaire

BLANC / GRIS (Neutral)
  #FFFFFF  — Fond principal
  #F8FAFC  — Slate 50 — fond alternatif (panneau latéral, cartes)
  #E2E8F0  — Slate 200 — bordures, séparateurs
  #94A3B8  — Slate 400 — texte désactivé, placeholders
```

### Couleurs sémantiques

```
VERT DISPONIBLE
  #16A34A  — Green 600 — places disponibles, beau temps, succès
  #DCFCE7  — Green 100 — badge "places dispo"

ROUGE ALERTE
  #DC2626  — Red 600 — complet, alerte, erreur
  #FEE2E2  — Red 100 — badge "complet"

BLEU INFO
  #2563EB  — Blue 600 — liens, info, pluie/météo
  #DBEAFE  — Blue 100 — badge info

JAUNE ATTENTION
  #CA8A04  — Yellow 600 — attention, bientôt complet
  #FEF9C3  — Yellow 100 — badge "plus que X places"
```

### Couleurs par catégorie de course

```
SPRINT CUP      #FF5A1F  (orange primary)   — la catégorie la plus courante
ENDURANCE CUP   #2563EB  (bleu)             — endurance = stratégie, calme
JUNIOR CUP      #16A34A  (vert)             — junior = accessible, fun
AUTRE            #8B5CF6  (violet)           — événements spéciaux
```

Ces couleurs sont utilisées sur :
- Les marqueurs de la carte
- Les badges de catégorie dans les listings
- Les filtres par catégorie

### Mode sombre (V2)

```
Fond principal   : #0F172A  (slate 900)
Fond carte       : Style "Dark Matter" MapTiler
Fond panneaux    : #1E293B  (slate 800)
Texte principal  : #F1F5F9  (slate 100)
Texte secondaire : #94A3B8  (slate 400)
Orange primary   : #FF7A45  (légèrement plus clair pour contraste sur fond sombre)
Bordures         : #334155  (slate 700)
```

---

## 3. Typographie

### Choix des polices

**Titres & headings : Space Grotesk**
- Police géométrique avec du caractère, ni trop sérieuse ni trop playful
- Évoque le tech/sport sans être agressive
- Variable font (poids 300-700), gratuite (Google Fonts)
- Utilisée pour : H1-H4, nom du site, boutons principaux

**Corps de texte & données : Inter**
- Le standard du web moderne. Lisibilité parfaite à toutes les tailles
- Variable font, optimisée pour les écrans
- **Feature `font-variant-numeric: tabular-nums`** pour les données chiffrées (prix, distances, places) — donne des chiffres à largeur fixe sans charger une police mono supplémentaire
- Utilisée pour : paragraphes, labels de filtres, descriptions, prix, distances, compteurs

> **Note :** JetBrains Mono a été écarté pour économiser ~50 KB de chargement. Inter avec `tabular-nums` offre le même alignement des chiffres sans police supplémentaire.

### Échelle typographique

```
H1     : Space Grotesk 700   — 2.25rem (36px)  — Titre de page
H2     : Space Grotesk 600   — 1.75rem (28px)  — Sections
H3     : Space Grotesk 600   — 1.375rem (22px) — Sous-sections, nom de circuit
H4     : Space Grotesk 500   — 1.125rem (18px) — Titres de cartes
Body   : Inter 400            — 1rem (16px)     — Texte courant
Body-sm: Inter 400            — 0.875rem (14px) — Texte secondaire, metadata
Caption: Inter 400            — 0.75rem (12px)  — Labels, timestamps
Data   : Inter 600 tabular-nums — 1rem (16px)  — Chiffres importants (prix, km)
Data-lg: Inter 700 tabular-nums — 1.5rem (24px) — Prix mis en avant
```

### Tailwind config

```js
fontFamily: {
  heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
  body: ['Inter', 'system-ui', 'sans-serif'],
}
```

---

## 4. Iconographie

### Système d'icônes : Lucide React

- Open source, tree-shakeable, cohérent
- Style : lignes fines (stroke 1.5-2px), coins arrondis
- 1000+ icônes couvrant tous nos besoins
- **Toujours utiliser des icônes Lucide en production** (les emojis dans ce document sont des placeholders de wireframe uniquement)

### Icônes spécifiques KartHopper

Certaines icônes n'existent pas dans Lucide et devront être custom (SVG) :
- **Casque de karting** — icône de marque, utilisée dans le logo et les badges
- **Drapeau à damier** — catégorie course / arrivée
- **Kart (vue de dessus)** — marqueur de carte alternatif

### Icônes météo (marqueurs carte)

Icônes simplifiées pour les marqueurs de carte (16x16px), SVG custom ou Lucide :
```
Soleil       → Sun (Lucide)         → Code WMO 0-1
Nuageux      → CloudSun (Lucide)    → Code WMO 2-3
Brouillard   → CloudFog (Lucide)    → Code WMO 45-48
Pluie légère → CloudDrizzle (Lucide)→ Code WMO 51-55, 80
Pluie        → CloudRain (Lucide)   → Code WMO 61-65, 81-82
Neige        → Snowflake (Lucide)   → Code WMO 71-86
Orage        → CloudLightning       → Code WMO 95-99
```

### Icônes transport (panneau budget V2)

```
Voiture      → Car (Lucide)
Train        → Train (Lucide)
Avion        → Plane (Lucide)
Covoiturage  → Users (Lucide)
Hôtel        → Hotel (Lucide)
Budget total → Wallet (Lucide)
```

---

## 5. Style de la carte

### Style de base : MapTiler "Positron" (personnalisé)

Le style Positron (CartoDB) est un fond de carte clair, minimaliste, avec des gris doux. Il met en valeur les marqueurs sans distraire. On le personnalise :

```
Fond de carte   : #F8FAFC (match le fond de l'app)
Routes          : #E2E8F0 (subtiles)
Autoroutes      : #CBD5E1 (un peu plus visibles)
Labels villes   : #64748B, Inter 12px
Eau             : #DBEAFE (bleu très pâle)
Espaces verts   : #DCFCE7 (vert très pâle)
```

### Mode sombre (V2)
Style MapTiler "Dark Matter" personnalisé pour matcher la palette nuit.

### Marqueurs de circuit

**Design du marqueur :**
- Cercle de 32px de diamètre avec bordure blanche de 2px (ombre portée douce)
- Couleur de fond = couleur de la catégorie dominante du circuit
- Au centre : nombre de courses à venir (en blanc, Inter Bold 12px)
- Si 0 courses : marqueur grisé (#94A3B8)

```
Marqueur normal :
  ┌─────────┐
  │  ● 5    │  ← cercle orange avec "5" (5 courses à venir)
  └─────────┘

Marqueur sélectionné :
  ┌─────────┐
  │  ● 5    │  ← cercle agrandi (40px) + anneau de sélection (4px)
  └─────────┘

Marqueur "complet" (toutes les courses complètes) :
  ┌─────────┐
  │  ● 2    │  ← cercle rouge avec "2"
  └─────────┘

Marqueur cluster :
  ┌─────────┐
  │  ● 47   │  ← cercle slate-800 avec nombre total de circuits
  └─────────┘
```

**Badge météo (V2) :**
- Petite icône météo (12x12px) positionnée en haut à droite du marqueur
- Fond blanc avec micro ombre pour la lisibilité

### Popup au clic sur un marqueur

```
┌──────────────────────────────────────┐
│  [Photo circuit — 16:9 crop]         │
├──────────────────────────────────────┤
│ CIRCUIT DE LYON                      │  ← Space Grotesk 600, 16px
│  MapPin  Saint-Laurent-de-Mure, FR   │  ← Inter 400, 14px, slate-500
│                                      │
│  Flag  3 courses à venir             │
│ ━━━━━━━━━━━━━━━━━━━━                │
│  [Sprint CUP] · 21 mars · 90 €      │  ← badge orange
│  [Endurance]  · 28 mars · 120 €     │  ← badge bleu
│  [Sprint CUP] · 4 avr  · 90 €       │  ← badge orange
│                                      │
│ [Voir le circuit →]                  │  ← lien kart-700 (#C23D0F)
└──────────────────────────────────────┘
```

---

## 6. Composants UI

### Cartes de course (RaceCard)

La carte de course est l'élément UI le plus répété. Elle doit être scannable en < 2 secondes.

```
┌──────────────────────────────────────────────────┐
│  [SPRINT]  Gold Club Sprint - Week 11            │  ← badge catégorie + titre
│            Experience Factory Eupen, Belgique    │  ← lieu
│                                                   │
│  Calendar 21 mars 2026     Car  SODI SPORT 270cc │  ← date + kart
│  Clock  3 × 10 min        MapPin  142 km         │  ← durée + distance
│                                                   │
│  ┌──────────────────────────────────────────┐    │
│  │  90,00 €          │  19/40 places        │    │  ← Inter 600 tabular-nums
│  │                    │  ████████░░ 48%      │    │  ← jauge remplissage
│  └──────────────────────────────────────────┘    │
│                                                   │
│  [S'inscrire sur SWS →]           [Budget ▾]     │  ← CTA + détail budget
└──────────────────────────────────────────────────┘
```

**Variantes d'état :**
- **Presque complet** (>80%) : bordure gauche jaune, badge "Plus que 5 places"
- **Complet** : bordure gauche rouge, badge "Complet", carte légèrement désaturée, CTA désactivé
- **Inscription bientôt close** (<48h) : badge rouge "Clôture demain"
- **Premium locked** : panneau budget flouté avec cadenas + "Débloquer avec Premium"

### Badges

Tous les badges suivent le même pattern :
```
┌─────────────────┐
│ ● Sprint CUP    │  ← cercle couleur + texte, fond pâle, border-radius 9999px
└─────────────────┘
```

Taille : `px-2.5 py-0.5 text-xs font-medium rounded-full`

| Badge | Couleur texte | Couleur fond |
|-------|--------------|-------------|
| Sprint CUP | #C23D0F (kart-700) | #FFF1EB |
| Endurance CUP | #1D4ED8 (blue-700) | #DBEAFE |
| Junior CUP | #15803D (green-700) | #DCFCE7 |
| Complet | #DC2626 | #FEE2E2 |
| Bientôt complet | #A16207 (yellow-700) | #FEF9C3 |
| Places dispo | #15803D | #DCFCE7 |
| Indoor | #4F46E5 (indigo-600) | #EEF2FF |
| Outdoor | #047857 (emerald-700) | #D1FAE5 |
| Premium | #C23D0F | #FFF1EB + icône Star |

> Note : toutes les couleurs de texte de badge passent WCAG AA sur leur fond respectif.

### Filtres

```
┌─────────────────────────────────────────────────────────────┐
│  MapPin < 200 km ▾  │  Calendar Mars-Avr ▾  │  Flag Sprint ✓ End ✓  │
│  Wallet < 150 € ▾   │  Home Outdoor ▾       │  SlidersHorizontal Plus ▾  │
└─────────────────────────────────────────────────────────────┘
```

- Barre horizontale sticky en haut du panneau latéral (desktop) ou bottom sheet (mobile)
- Chaque filtre est un bouton-dropdown avec mini preview de la valeur
- Filtre actif : fond kart-50 (#FFF1EB), bordure kart-500
- Filtre inactif : fond blanc, bordure slate-200
- **Filtre focus** : `ring-2 ring-kart-500 ring-offset-2` (visible au clavier)
- Compteur de résultats affiché en temps réel : "47 courses trouvées"

### Boutons

```
Primary   : bg-kart-500 text-white hover:bg-kart-400 focus-visible:ring-2 ring-kart-500 ring-offset-2
Secondary : bg-white border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 ring-slate-400
Ghost     : text-kart-700 hover:bg-kart-50 focus-visible:ring-2 ring-kart-500
Danger    : bg-red-600 text-white hover:bg-red-700 focus-visible:ring-2 ring-red-600
```

Border radius : `rounded-lg` (8px) — ni trop rond (childish) ni trop carré (corporate).

**Focus states (a11y obligatoire) :**
- Tous les éléments interactifs ont un `focus-visible:ring-2` visible
- Couleur du ring = couleur primaire du contexte (kart-500 pour les éléments brand, slate-400 pour les neutres)
- `ring-offset-2` pour un espace entre l'élément et l'anneau (meilleure visibilité)
- Le ring n'apparaît qu'au clavier (`focus-visible`), pas au clic

### Panneau budget déplacement (V2)

```
┌──────────────────────────────────────────────────┐
│  BUDGET DÉPLACEMENT          depuis Clermont-Fd  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                   │
│  Car  Voiture                                     │
│     142 km · 1h38 · ~14 € carburant · ~8 € péage│
│     Total voiture : 22 €                          │
│                                                   │
│  Train  Train                                     │
│     ~2h15 · 25-45 €                               │
│     [Voir sur Trainline →]                        │
│                                                   │
│  Plane  Avion                      non pertinent  │
│     (distance < 500 km)                           │
│                                                   │
│  Hotel  Hébergement                               │
│     Budget : ~50 € · Moyen : ~80 € · Premium : ~120 € │
│     [Voir sur Booking →]                          │
│                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Wallet  TOTAL ESTIMÉ                             │
│                                                   │
│     Inscription :        90 €                     │  ← Inter 600 tabular-nums
│     Transport :          22 €                     │
│     Hébergement :         — €                     │
│     ────────────────────────                      │
│     TOTAL :             112 €                     │  ← Inter 700 tabular-nums, 1.5rem, kart-700
│                                                   │
│  Settings  Paramètres : 7L/100km · Diesel · 1 pers │
└──────────────────────────────────────────────────┘
```

---

## 7. Layout & responsive

### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────┐
│  Logo KartHopper    [Carte] [Calendrier]    FR▾  [Login] │  ← navbar sticky
├────────────────────┬─────────────────────────────────────┤
│                    │                                      │
│  FILTRES           │                                      │
│  ──────────        │          CARTE INTERACTIVE           │
│  47 résultats      │          (MapLibre GL JS)            │
│                    │                                      │
│  ┌──────────────┐  │          ● 5                         │
│  │ RaceCard 1   │  │             ● 3      ● 12           │
│  └──────────────┘  │                                      │
│  ┌──────────────┐  │      ● 8                             │
│  │ RaceCard 2   │  │                  ● 2                 │
│  └──────────────┘  │                                      │
│  ┌──────────────┐  │                                      │
│  │ RaceCard 3   │  │                                      │
│  └──────────────┘  │                                      │
│  ...               │                                      │
│                    │                                      │
├────────────────────┴─────────────────────────────────────┤
│                        Footer                             │
└──────────────────────────────────────────────────────────┘

Proportions : panneau latéral 380px fixe | carte = reste de l'écran
```

### Mobile (<768px)

```
┌──────────────────────┐
│ Logo KH   [≡]  FR▾   │  ← navbar compacte
├──────────────────────┤
│                      │
│    CARTE PLEIN ÉCRAN │
│                      │
│    ● 5     ● 3       │
│       ● 8            │
│              ● 12    │
│                      │
│  [Recentrer]         │  ← bouton flottant (Locate Lucide)
│                      │
├──────────────────────┤  ← bottom sheet (drag up)
│  ━━━ (handle)        │
│  47 courses          │
│  Filtres: <200km Sprint │
│                      │
│  ┌──────────────────┐│
│  │ RaceCard 1       ││
│  └──────────────────┘│
│  ┌──────────────────┐│
│  │ RaceCard 2       ││
│  └──────────────────┘│
└──────────────────────┘

3 états du bottom sheet :
  - Peek (25%) : juste le compteur + filtres actifs résumés
  - Half (50%) : liste scrollable
  - Full (90%) : liste + filtres complets, carte réduite
```

### Tablette (768-1024px)

Même layout que desktop mais panneau latéral en overlay (toggle) plutôt que fixe.

---

## 8. États vides et erreurs

Chaque état vide a un design dédié — jamais de page blanche.

### Aucun résultat (filtres trop restrictifs)

```
┌──────────────────────────────────┐
│                                  │
│        SearchX (Lucide, 48px)    │
│                                  │
│   Aucune course trouvée          │  ← Space Grotesk 600, slate-900
│                                  │
│   Essaie d'élargir tes filtres   │  ← Inter 400, slate-500
│   ou de chercher dans une        │
│   autre zone.                    │
│                                  │
│   [Réinitialiser les filtres]    │  ← bouton secondary
│                                  │
└──────────────────────────────────┘
```

### Pas de géolocalisation

```
┌──────────────────────────────────┐
│                                  │
│        MapPin (Lucide, 48px)     │
│                                  │
│   Où es-tu ?                     │
│                                  │
│   Active la géolocalisation      │
│   ou entre ta ville pour voir    │
│   les courses proches de toi.    │
│                                  │
│   [Entrer ma ville]              │  ← champ de saisie Photon
│                                  │
└──────────────────────────────────┘
```

### Erreur de chargement des données

```
┌──────────────────────────────────┐
│                                  │
│        AlertTriangle (48px)      │
│                                  │
│   Oups, données indisponibles    │
│                                  │
│   On n'a pas pu charger les      │
│   courses. Réessaie dans         │
│   quelques instants.             │
│                                  │
│   [Réessayer]                    │  ← bouton primary
│                                  │
└──────────────────────────────────┘
```

### Première visite (onboarding léger)

```
┌──────────────────────────────────┐
│                                  │
│   Bienvenue sur KartHopper !     │  ← Space Grotesk 700, 24px
│                                  │
│   Trouve ta prochaine course     │
│   de karting en 30 secondes.     │
│                                  │
│   1. Active ta position          │
│   2. Choisis tes filtres         │
│   3. Clique sur un circuit       │
│                                  │
│   [C'est parti →]                │  ← bouton primary, ferme l'overlay
│                                  │
└──────────────────────────────────┘

Affiché une seule fois (flag en localStorage).
```

---

## 9. Animations & micro-interactions

### Principes
- **Rapides** : max 200ms pour les transitions UI (filtres, hovers)
- **Fluides** : 300ms ease-out pour les animations de layout (panneau, bottom sheet)
- **Utiles** : chaque animation doit communiquer un changement d'état, pas juste "faire joli"
- **Réduites** : respecter `prefers-reduced-motion` (désactiver toutes les animations)

### Animations spécifiques

| Élément | Animation | Durée | Easing |
|---------|-----------|-------|--------|
| Marqueurs carte (apparition) | Scale 0 → 1 + fade in | 200ms | ease-out |
| Marqueur sélectionné | Scale pulse (1 → 1.15 → 1) | 300ms | spring |
| Clustering (zoom) | Markers split/merge smoothly | 300ms | ease-in-out |
| Bottom sheet (mobile) | Slide up/down + spring settle | 350ms | spring |
| Filtre activé | Fond → kart-50, bordure → kart-500 | 150ms | ease |
| RaceCard hover | Elevation shadow-card → shadow-card-hover | 150ms | ease |
| Panneau budget (ouverture) | Height expand + fade in du contenu | 250ms | ease-out |
| Badge "complet" | Subtle shake (1x) quand il passe de "dispo" à "complet" | 400ms | ease |
| Compteur places | Number tick animation (19 → 20) | 200ms | ease |
| Chargement carte | Skeleton placeholders (shimmer) | — | loop |
| Chargement liste | Skeleton RaceCards (3-4 fantômes) | — | loop |

### Transitions de page (Next.js)

- Pas de transition lourde entre pages (instant navigation via RSC)
- Fade-in subtil (100ms) du contenu lors du premier chargement
- La carte persiste entre les pages (pas de rechargement quand on passe de la liste au détail)

---

## 10. Logo & branding

### Concept du logo

Le logo combine 3 idées :
1. **Le pin de carte** (location / découverte)
2. **La vitesse** (karting / dynamisme)
3. **Le "hop"** (mouvement, rebond entre circuits)

### Logo principal

```
   ╱╲
  ╱🏁╲     KartHopper
  ╲  ╱
   ╲╱
  (pin)
```

Description : un pin de carte stylisé avec un mini drapeau à damier intégré à l'intérieur. Le pin a une forme légèrement inclinée/dynamique (pas parfaitement symétrique) pour évoquer le mouvement.

- **Couleur du pin** : Orange #FF5A1F
- **Damier à l'intérieur** : blanc + orange alternance
- **Texte "KartHopper"** : Space Grotesk 700, #0F172A
- **Le "H" de Hopper** est légèrement surélevé par rapport à la baseline (micro-animation du "hop")

### Variantes

| Variante | Usage |
|----------|-------|
| Logo + texte (horizontal) | Navbar desktop, header emails |
| Logo seul (pin) | Favicon, app icon, marqueur carte "ma position" |
| Logo + texte (empilé) | Landing page, splash screen mobile |
| Logo monochrome blanc | Sur fond sombre, footer |
| Logo monochrome noir | Print, partenariats |

### Favicon

Le pin orange sur fond transparent, 32x32px. Doit être reconnaissable à cette taille → simplifier le damier en 2x2 carrés.

---

## 11. Implémentation Tailwind

### tailwind.config.ts (extrait)

```ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class', // Prêt pour le mode sombre V2
  theme: {
    extend: {
      colors: {
        // Brand
        kart: {
          50: '#FFF1EB',
          100: '#FFE0D1',
          200: '#FFC2A3',
          300: '#FF9E6E',
          400: '#FF7A45',
          500: '#FF5A1F',  // PRIMARY (boutons, marqueurs — PAS pour texte sur blanc)
          600: '#E84D15',
          700: '#C23D0F',  // Texte orange sur fond blanc (WCAG AA OK)
          800: '#9A310C',
          900: '#7C2A0A',
        },
        // Sémantique catégories
        sprint: '#FF5A1F',
        endurance: '#2563EB',
        junior: '#16A34A',
        special: '#8B5CF6',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'panel': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
}
```

### Classes utilitaires récurrentes

```
Carte de course :
  bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow
  focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2

Badge catégorie :
  Sprint    → bg-kart-50 text-kart-700 px-2.5 py-0.5 text-xs font-medium rounded-full
  Endurance → bg-blue-100 text-blue-700 ...
  Junior    → bg-green-100 text-green-700 ...

Prix en évidence :
  font-body text-lg font-semibold text-slate-900 tabular-nums

Bouton primary :
  bg-kart-500 text-white hover:bg-kart-400 rounded-lg px-4 py-2 font-heading font-medium
  focus-visible:ring-2 focus-visible:ring-kart-500 focus-visible:ring-offset-2

Panneau latéral :
  bg-slate-50 border-r border-slate-200 w-[380px]
```

---

## 12. Charte de contenu

### Ton éditorial

- **Direct** : "3 courses ce weekend près de chez toi" (pas "Découvrez les opportunités de compétition...")
- **Utile** : les chiffres d'abord, le blabla après ("142 km · 1h38 · 22 €")
- **Encourage** : "Plus que 5 places !" → urgence douce (pas anxiogène)
- **Inclusif** : tutoiement, langage simple, pas de jargon technique

### Formatage des données

Les prix et dates sont formatés via `Intl.NumberFormat` et `Intl.DateTimeFormat` avec la locale de l'utilisateur.

| Donnée | Format FR | Format EN |
|--------|-----------|-----------|
| Prix | 90,00 € | €90.00 |
| Distance | 142 km | 142 km |
| Durée trajet | 1h38 | 1h 38m |
| Durée course | 3 × 10 min | 3 × 10 min |
| Date | 21 mars 2026 | 21 Mar 2026 |
| Date courte | 21 mars | 21 Mar |
| Places | 19/40 (48 %) | 19/40 (48%) |
| Température | 15 °C | 15 °C |
| Note | 4,2/5 (23 avis) | 4.2/5 (23 reviews) |

### Textes d'urgence (badges)

| Situation | Badge FR | Badge EN |
|-----------|----------|----------|
| >50% places prises | (rien) | (rien) |
| >80% places prises | "Plus que X places" (jaune) | "Only X spots left" |
| 100% complet | "Complet" (rouge) | "Full" |
| Inscription clôture < 48h | "Clôture demain" (rouge) | "Closes tomorrow" |
| Inscription clôture < 7 jours | "Clôture dans X jours" (jaune) | "Closes in X days" |

---

## 13. Checklist d'implémentation

### Sprint 0 (setup)
- [ ] Installer les fonts via `next/font/google` : Space Grotesk + Inter
- [ ] Configurer le `tailwind.config.ts` avec la palette complète (kart-50 à kart-900, sémantiques, shadows)
- [ ] Configurer `darkMode: 'class'` (prêt pour V2)
- [ ] Configurer shadcn/ui avec le thème custom (couleur primary = kart-500, radius = 8px)
- [ ] Créer le composant Badge générique (sprint/endurance/junior/statut)
- [ ] Créer la classe utilitaire `tabular-nums` pour les données chiffrées
- [ ] Favicon placeholder (pin orange SVG simplifié)
- [ ] Vérifier le contraste de tous les couples couleur texte/fond (outil : WebAIM Contrast Checker)

### Sprint 2 (carte)
- [ ] Personnaliser le style MapTiler Positron (couleurs d'eau, routes, labels)
- [ ] Implémenter les marqueurs de circuit (cercles colorés avec compteur)
- [ ] Implémenter le clustering (marqueurs slate-800)
- [ ] Implémenter la popup au clic
- [ ] Focus visible sur les marqueurs (navigation clavier)

### Sprint 3 (liste + filtres)
- [ ] Implémenter le composant RaceCard (toutes les variantes d'état)
- [ ] Implémenter la barre de filtres (style dropdown avec preview)
- [ ] Implémenter le bottom sheet mobile (3 états : peek/half/full)
- [ ] Implémenter les états vides (0 résultats, pas de géoloc, erreur)
- [ ] Animer les transitions filtre ↔ carte
- [ ] Tester avec `prefers-reduced-motion`

### Sprint 4 (polish)
- [ ] Créer la landing page avec hero visuel
- [ ] Implémenter l'onboarding première visite
- [ ] Vérifier les contrastes a11y (axe-core dans les tests Playwright)
- [ ] Vérifier tous les focus states au clavier
- [ ] Générer le logo en SVG (toutes variantes)
