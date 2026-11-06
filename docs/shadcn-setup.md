# Tailwind v4 + shadcn setup verification

2026-11-07. Setup only; no component adoption, application redesign, V3 implementation, migration or Electron security change. Existing unrelated working-tree changes were preserved; no Git commit or push performed.

## Configuration

| File | Change |
| --- | --- |
| `vite.config.mjs` | Add installed Tailwind Vite plugin and `@` → `src/renderer`. Preserve renderer root, relative asset base and build output. |
| `tsconfig.renderer.json` | Matching `@/*` → `./src/renderer/*` paths; relative paths work without `baseUrl`. |
| `tsconfig.json` | Extend renderer configuration so shadcn discovers the same alias. Existing main/preload TypeScript configuration remains separate. |
| `src/renderer/styles.css` | Import `./shadcn.css`; original stylesheet content otherwise byte-for-byte preserved. Existing `main.tsx` already loads it. |
| `src/renderer/shadcn.css` | Tailwind theme/utilities, animations, shadcn variants and generated Nova theme. Use documented reset-free Tailwind imports, existing system font and separate `--shadcn-accent` to preserve the existing violet `--accent`. No new universal/body/font reset. |
| `components.json` | Base UI + Nova (`style: base-nova`), explicit CSS entry and renderer component/utils/hooks aliases. |
| `src/renderer/lib/utils.ts` | Generated `cn` export. |
| `package.json`, `package-lock.json` | Initialize Base UI, class-variance-authority, cn, lucide-react and tw-animate-css; shadcn 4.23.0 is a development dependency, keeping its CLI/server toolchain out of production packaging. Remove only the Geist font dependency introduced by initialization. Preserve other installed dependencies. |

Initialization actually passed framework, Tailwind v4 and import-alias checks:

```sh
npm exec --yes --ignore-scripts --package=shadcn@4.23.0 -- shadcn init --base base --preset nova --no-monorepo --no-reinstall --yes
```

The CLI help's `base-nova` preset argument was rejected; accepted arguments are `--base base --preset nova`. The generated configuration correctly uses `style: base-nova`.

The initial full `@import "tailwindcss"` and generated theme changed global styles, including the existing accent. After initialization, the stylesheet was refined to Tailwind's documented theme/utilities imports without Preflight. Its configured CSS path resolves correctly and component addition works. `shadcn info` reports v4 and the alias; its **automatic** CSS discovery is blank for this modular import form, while its **resolved configured** CSS path is correct. Use the initialized `components.json`; forcing a fresh init would reintroduce default theme/reset changes.

References: [official Vite setup](https://ui.shadcn.com/docs/installation/vite), [CLI](https://ui.shadcn.com/docs/cli), [Tailwind reset-free integration](https://tailwindcss.com/docs/preflight#disabling-preflight).

## Actual execution

| Check | Result |
| --- | --- |
| `npm run typecheck` / build | Both TypeScript targets and renderer build pass. |
| `npm test` | 78/78 pass, zero skips with normal Windows permissions. Initial sandbox execution blocked junction/rename fixtures; rerun passed without changing tests. |
| `npm run test:e2e` | 21/21 pass, zero skips; existing keyboard/compact/wide/error/security/Preview/Resume/release/workflow checks. |
| `npm run package` | Windows x64 package rebuilt successfully; task-specific temporary directory. |
| `npm run test:packaged` | 4/4 pass, zero skips; bundled ESM, SQLite, migrations and restart recovery. |
| Tailwind/alias probe | Actual Vite configuration compiles flex/spacing/Nova color utilities and resolves `@/lib/utils`; cn conflict merging passes. Temporary probe only, no app UI added. |
| `shadcn add button --dry-run` | Pass; resolves `src/renderer/components/ui/button.tsx`; no component written. |
| Style comparison | Sampled Home/project computed styles match baseline exactly after compatibility adjustments. Original CSS bytes preserved after import. |
| Production dependency audit | Exit 0; zero reported vulnerabilities. Not a full dependency/security audit. |
| Whitespace review | Scoped `git diff --check` passes. |

Logs, isolated test profiles, temporary probes and before/after screenshots: ignored `artifacts/shadcn-initialization/`. The existing renderer entry, IPC/preload/main, CSP, schema, migrations and application behavior were not edited for this setup.

Limit: no actual shadcn component was added/adopted or manually accepted. Reset-free integration is deliberate; review component spacing and theme behavior when components are introduced. Existing UI acceptance and unrelated development-tool maintenance remain separate.
