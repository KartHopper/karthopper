---
globs:
  - "**/*.ts"
  - "**/*.tsx"
---

<!-- source: My files/Claude/.claude/rules/typescript-conventions.md @ 2026-04-18 -->

# Conventions TypeScript

À copier dans `<projet>/.claude/rules/` pour tout projet TypeScript. Les règles de **format** sont **déléguées à `prettier` + `eslint`** — pas répétées ici.

## Délégation au linter (obligatoire)

Le projet doit avoir configuré :
- `prettier` — formattage (2 espaces, single quotes par défaut, à fixer dans `.prettierrc`).
- `eslint` avec config TypeScript (ex: `@typescript-eslint/recommended`).
- `tsconfig.json` avec `strict: true`.

Lancer après chaque modification : `pnpm prettier --write . && pnpm eslint --fix .`

Si pas configuré : ajouter avant d'écrire du code.

## Conventions non-format

### TypeScript strict

- `strict: true` dans `tsconfig.json` — non-négociable.
- `noImplicitAny`, `strictNullChecks` activés.
- **Pas de `any`** sauf justification explicite en commentaire (`// eslint-disable-next-line ... -- raison`).
- **Pas de `as any`** non plus.
- Si tu ne connais pas le type, utilise `unknown` puis narrow avec type guards.

### Naming

- `camelCase` pour variables, fonctions, méthodes.
- `PascalCase` pour types, interfaces, classes, composants React.
- `UPPER_SNAKE` pour constantes globales.
- `kebab-case` pour fichiers (sauf composants React → `PascalCase.tsx`).
- Pas de préfixe `I` sur interfaces (`User` pas `IUser`).

### Imports

- **Imports absolus** avec alias `@/` (configuré dans `tsconfig.json`).
- **Type-only imports** : `import type { Foo } from '...'` quand seulement pour types.
- **Pas de `import *`** : nuit au tree-shaking.
- Imports groupés (auto par `eslint-plugin-import`) : externals → internals → relatives.

### Types vs interfaces

- **`interface`** pour les objets extensibles (composants props, contracts d'API).
- **`type`** pour unions, intersections, primitives, mappings.
- Cohérence : si le projet utilise `type` partout, garder `type`.

### Fonctions

- **Arrow functions** par défaut pour callbacks, fonctions courtes.
- **`function` keyword** pour functions exportées de niveau module (hoisting + clarté).
- **Type de retour explicite** sur exports publics.
- **Async/await** plutôt que chaînes `.then()`.

### React (si applicable)

- **Fonctions, pas classes** (sauf cas exceptionnel error boundary).
- **Props typées** via `interface` ou `type`.
- **Server Components par défaut** (Next.js App Router) — `'use client'` uniquement si nécessaire.
- **Pas d'`any` sur props** : préciser ou utiliser `React.PropsWithChildren`.
- **Hooks** : nom commence par `use`, appelés au top-level (pas dans condition/loop).

### Gestion d'erreurs

- **Try/catch** autour des opérations qui peuvent fail (parse JSON, fetch).
- **Result types** ou exceptions typées plutôt que `throw new Error('string')` sans contexte.
- **Pas de `catch (e)` silencieux** : log au minimum.

### Async

- **`async/await`** plutôt que `.then().catch()`.
- **`Promise.all()`** pour parallélisme indépendant.
- **`Promise.allSettled()`** quand on tolère des échecs partiels.

## Anti-patterns à éviter

- **`any` partout** : casse l'intérêt de TypeScript.
- **`!` (non-null assertion) à la légère** : si tu es sûr que ce n'est pas null, le narrow proprement.
- **`@ts-ignore` sans commentaire** : explique pourquoi (idéalement utiliser `@ts-expect-error`).
- **Mutation de props** dans React : props sont immutables, retourner du nouveau state.
- **`useEffect` pour fetch initial dans server component possible** : préférer fetch côté serveur.
- **Hooks conditionnels** : `if (x) { useState(...) }` → break Rules of Hooks.
- **`process.env.X` directement dans le code client Next.js** : sera shippé. Préfixer `NEXT_PUBLIC_` si OK pour client, sinon utiliser server-only.

## Performance

- **`React.memo`** uniquement si profiler montre re-renders inutiles (pas par défaut).
- **`useMemo` / `useCallback`** parcimonie : surchargent souvent plus qu'ils n'aident.
- **Tree-shaking friendly** : pas de `import *`, pas de side effects dans imports.

## Sécurité

- **Validation des inputs** : `zod`, `valibot`, ou typebox pour les inputs externes.
- **Pas de `dangerouslySetInnerHTML`** sauf sanitization (DOMPurify).
- **Variables d'env serveur** : ne jamais expose côté client (Next.js `NEXT_PUBLIC_*` rule).
- **CSP** : configurer `Content-Security-Policy` côté serveur (cf. leçon Keyboard Layouts : pas de scripts inline).

## Pourquoi cette rule existe

- Cohérence cross-projet TS (Next.js apps, scripts Node, librairies).
- Capture les pièges TS classiques (any, hooks, server/client).
- Délègue le format au linter pour garder cette rule courte.
