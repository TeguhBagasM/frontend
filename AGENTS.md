# AGENTS.md — frontend

React 19 + TypeScript + Vite 8 single-page app. Part of the "Pendaftaran Beasiswa Pelatihan" microservices project — see root `AGENTS.md` and `PRD.md` for full system context.

## Commands

```bash
npm run dev        # Vite dev server (HMR)
npm run build      # tsc -b && vite build  (type-checks THEN bundles — build fails if TS errors exist)
npm run lint       # eslint .  (flat config, eslint.config.js)
npm run preview    # serve production build locally
```

No test runner is configured. If you add tests, consider vitest (Vite-native).

## TypeScript gotchas

- `verbatimModuleSyntax: true` — type-only imports MUST use `import type { X }` syntax. Named imports that are only used as types will fail to compile.
- `erasableSyntaxOnly: true` — no `enum`, no `namespace`, no legacy parameter properties. Use `as const` objects + union types instead.
- `noUnusedLocals: true` / `noUnusedParameters: true` — unused variables are errors, not warnings. Prefix with `_` if intentionally unused.
- `tsc -b` (build mode) runs before `vite build`. It uses the composite project references in `tsconfig.json` (app + node configs).
- Target is `es2023`, module resolution is `bundler` — modern syntax and `import` extensions are fine.

## Architecture notes

- Entry point: `src/main.tsx` → `src/App.tsx`
- This is a **flat scaffold** — no routing, state management, or API client yet. When adding structure, look at `service-rbac/` (the only implemented backend service) for API contracts.
- All backend traffic MUST go through the API Gateway at `localhost:5000` (port defined in `docker-compose.yml`). Never call backend services directly.
- The gateway exposes `/api/auth/*`, `/api/users/*`, `/api/master/*`, `/api/dokumen/*`, `/api/transaksi/*`.

## Style conventions

- ESLint flat config (`eslint.config.js`) — uses `typescript-eslint`, `react-hooks`, and `react-refresh` plugins. No Prettier configured.
- `"type": "module"` in package.json — ESM throughout.
