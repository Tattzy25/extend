# Project Investigation Summary

*March 2026*

## ROOT CAUSE

**Turbopack (Next.js 16 default bundler) on Windows produces corrupted JavaScript output.** The compiled chunks contain syntax errors (`Invalid or unexpected token`, `Unexpected end of input`). When the browser loads these chunks, JavaScript parsing fails, React never hydrates, and the app is dead. Buttons, upload, and all interactivity fail because the client-side code never runs.

This is not an application bug. Your `app/page.tsx`, `app/api/generate/route.ts`, upload logic, and button handlers are correct. The failure occurs before any of that executes.

---

## CHAIN OF FAILURE

1. `pnpm dev` runs Next.js 16 with Turbopack
2. Turbopack compiles your app and dependencies into JS chunks in `.next/`
3. On Windows, Turbopack emits malformed JS (known platform bug)
4. Browser requests chunks → receives invalid syntax → throws
5. React fails to load → no event handlers attached → nothing works

---

## EVIDENCE

- **Affected files:** `96f17_next_dist_compiled_*.js`, `node_modules__pnpm_*.js`, `react-server-dom-turbopack`, `react-dom`, `next-devtools`
- **Error types:** `SyntaxError: Invalid or unexpected token`, `SyntaxError: Unexpected end of input`
- **Known context:** Multiple open Next.js 16 + Turbopack + Windows issues (import resolution, path handling, UTF-8, binary handling)

---

## APPLICATION CODE STATUS (VERIFIED)

| Component | Status |
|-----------|--------|
| `app/page.tsx` | Correct – CREATE button `onClick={handleGenerate}`, fetch to `/api/generate` |
| `app/api/generate/route.ts` | Correct – POST handler, Replicate call, error handling |
| `MultiImageUploadInput` | Correct – `onClick` triggers `fileInputRef.current?.click()`, `onChange` calls `addFiles` |
| `lib/payload.ts` | Correct – Replicate input schema matches model |
| `app/api/download/route.ts` | Correct |
| `app/actions.ts` | Correct (unused – page uses API route) |
| `REPLICATE_API_TOKEN` in `.env.local` | Required – no token = 401 from Replicate |

---

## FIX OPTIONS (RANKED)

### 1. Downgrade to Next.js 15 (recommended)

Next.js 15 defaults to webpack. Turbopack is opt-in with `--turbo` and is generally more stable.

```bash
pnpm add next@15
```

Then in `package.json`:
```json
"dev": "next dev",
"build": "next build"
```

Use Turbopack only if you need it: `next dev --turbo`. Webpack-first is usually safer on Windows.

### 2. Run in WSL (Windows Subsystem for Linux)

Turbopack behaves better on Linux. Run the project inside WSL; build artifacts are Linux-native and avoid Windows path/symlink issues.

### 3. Use Webpack temporarily

Use webpack until Turbopack on Windows is fixed:

```json
"dev": "next dev --webpack",
"build": "next build --webpack"
```

### 4. Try `npm` instead of `pnpm`

pnpm uses symlinks that can trigger path handling bugs with Turbopack on Windows. Reinstall with npm:

```bash
Remove-Item -Recurse node_modules, .next, pnpm-lock.yaml
npm install
npm run dev
```

### 5. Update Next.js to latest 16.x

If a newer patch improves Windows support:

```bash
pnpm update next
```

---

## WHAT DOES NOT NEED CHANGES

- Application logic (page, API routes, upload, handlers)
- Replicate integration
- FormData / fetch usage
- Tailwind CSS / PostCSS setup
- Environment variables

---

## ACTION

**Recommended:** Downgrade to Next.js 15 (`pnpm add next@15`), remove `.next`, and run `pnpm dev`. If that works, keep 15 until Turbopack on Windows is fixed in a later release.
