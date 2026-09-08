---
name: verify-hakoniwa-term
description: Verify hakoniwa-term, the React terminal UI library, via its vitest + Testing Library harness and the hakoniwa-sample-3 Vite playground. Reach for it before claiming any Terminal behavior works.
---

# Verify hakoniwa-term

`hakoniwa-term` is a React component library (`Terminal` in `src/Terminal.tsx`), not a
server. There is nothing to deploy. Verification means: build the library once, then drive
the real `Terminal` component through its existing harness
(vitest + `@testing-library/react` + `user-event` + jsdom, configured in
`vitest.config.ts` + `src/test/setup.ts`), plus the `example/hakoniwa-sample-3` Vite
playground for visual preset checks.

## Launch

The library itself has no dev server. "Launch" means build once, then drive each feature in
an isolated vitest run. Only start the demo server when a feature file explicitly asks for a
visual check.

```powershell
# 1. From the repo root (C:\Users\19172\Desktop\dev\hakoniwa-term):
pnpm install
pnpm build
# Ready signal: dist/index.js, dist/index.cjs, dist/index.d.ts, and dist/index.css all exist.

# 2. Headless drive (default, no server needed):
pnpm vitest run src/Terminal.test.tsx
# Ready signal: exit code 0, "Test Files  1 passed (1)", "Tests  N passed (N)".

# 3. Visual drive only (isolated demo instance, never the default port):
cd example/hakoniwa-sample-3
pnpm install
pnpm dev --port 5199 --strictPort
# Ready signal: vite prints "Local:   http://localhost:5199/".
# Teardown for the demo only: stop the PID recorded in .verify-demo-pid (see Cleanup).
# Never `taskkill` by image name; kill only what this run started.
```

`pnpm dev` without `--port 5199 --strictPort` is forbidden during verification: the default
Vite port (5173) may belong to the user's own session. Refusing to share an instance beats
corrupting it.

## Doctor

Run this read-only check first whenever anything looks off. It answers "is this instance
worth driving?" and changes nothing.

```powershell
node .opencode/skills/verify-hakoniwa-term/scripts/doctor.mjs [--port 5199]
```

It checks, in order: current directory is the `hakoniwa-term` repo root, `node_modules`
exists, `dist/index.js` + `dist/index.css` exist (built by `pnpm build`), `TERMINAL_PRESETS`
is importable from `src/Terminal.tsx`, `vitest.config.ts` + `src/test/setup.ts` exist, and
the verify port is free or owned by this run's PID file. Exit `0` means driveable. Any
failure prints the exact fix (usually `pnpm install` or `pnpm build`) and exits non-zero.
Do not proceed to Drive on a red doctor.

## Drive

The harness is vitest + Testing Library. The canonical interaction pattern lives in
`src/Terminal.test.tsx` (`typeAndRun` helper): get the textbox by role, type, press Enter.

```powershell
# Full suite (headless, preferred):
pnpm vitest run src/Terminal.test.tsx

# One feature only (use the -t string from the feature file):
pnpm vitest run src/Terminal.test.tsx -t "streams logs yielded by an async generator command" --reporter=verbose

# scripted wrapper that also saves the transcript as evidence:
node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "streams logs" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>
```

Stable handles only. In order of preference:

- `screen.getByRole("textbox")` — the single command input.
- `screen.getByRole("button", { name: "Run command" })` — submit via click.
- `screen.getByRole("button", { name: "Close terminal" })` — only rendered when `onClose`
  is provided (and `showCloseButton` is not `false`).
- `screen.getByText("<prompt> <command>")`, e.g. `user@t:~$ hello world` — echoed history.
- `screen.getByPlaceholderText("...")` — `placeholder` when idle, `systemLockedText`
  (`System locked during execution...` by default) while locked.
- CSS variables on the root element: `--terminal-bg`, `--terminal-text`,
  `--terminal-prompt`, etc. (preset + `theme` override, see `TERMINAL_PRESETS`).
- Playground-only visual handles in `example/hakoniwa-sample-3/src/App.tsx`: the
  `Terminal Preset Playground` heading, the `Preset:` `<select>`, and terminal input
  inside the Vite page at `http://localhost:5199/`.

Never reach for coordinates, tab order, or CSS-module class names (they are hashed).
Commands are case-insensitive on the first token (`args[0].toLowerCase()`); `clear`
always bypasses `commands` and empties history.

## Evidence

Every proof lands in `.opencode/skills/verify-hakoniwa-term/artifacts/<run-id>/` and
survives Cleanup. Capture the action AND the resulting state, never just the final screen:

- `vitest-transcript.txt` — full stdout/stderr + exit code of the `vitest run`
  (written by `run-verify.mjs`; if you run vitest by hand, redirect it yourself).
- `result.json` — `{ testName, exitCode, passed, timestamp }` from `run-verify.mjs`.
- `build.log` — `pnpm build` output proving which `dist/` the run drove.
- Visual proof only when the feature file demands it: an ARIA snapshot / DOM excerpt plus
  a screenshot with the playground identity (`Terminal Preset Playground` heading and
  `terminal -- preset: <name>` title) visible.

Proof standards:

- Exercise the real user path: render `<Terminal commands={...}>`, type into the textbox,
  submit with Enter or the `Run command` button. Never assert via internal setters,
  direct state injection, or test-only endpoints.
- Verify side effects alongside what is visible: echoed `input` line, yielded `log` rows,
  progress header (`<text>` + `<percent>%`), lock state (input `disabled` + locked
  placeholder), history cleared, `onClose` called, CSS variable values.
- A save/status line alone is insufficient: re-query the history (e.g. progress `42%`
  visible mid-run AND gone after completion; cleared text absent via `queryByText`).
- Mocks only where the repo already isolates the boundary: gated promises and inline
  `CommandAction` generators are fine; do not mock `Terminal` itself.
- Record the feature ID and entry point used with every artifact.

## Cleanup

```powershell
node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --cleanup [--out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>]
```

- Stops only the Vite demo PID recorded in `.verify-demo-pid` (started by you, this run).
  Never kill by process/image name.
- Removes scratch state: `.verify-demo-pid`, temp ports, demo `node_modules/.vite` cache
  only if this run created it.
- Never deletes `artifacts/<run-id>/`. After cleanup, confirm the transcript and
  `result.json` still exist at the named location — a cleanup that eats the proof fails.
- Vitest runs need no teardown (jsdom per test file, `cleanup()` in `src/test/setup.ts`).
- Run this cleanup after every failed iteration too, so broken attempts do not strand the
  demo port.

## Helpers

Both scripts are plain node (no install step) and every invocation is shown above.

- `scripts/doctor.mjs` — read-only readiness check.
  `node .opencode/skills/verify-hakoniwa-term/scripts/doctor.mjs [--port 5199]`
- `scripts/run-verify.mjs` — runs one vitest slice and saves the transcript + result.json,
  or tears down the demo instance.
  `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "streams logs" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`
  `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --cleanup [--out ...]`
