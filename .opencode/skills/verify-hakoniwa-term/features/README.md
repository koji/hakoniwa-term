# hakoniwa-term verification map

This directory is the maintained source for verifying the user-facing behavior of
hakoniwa-term's `Terminal` component. Read this index before driving the app, then use the
matching feature file as the recipe.

## Baseline preconditions

- Work from the repo root (`package.json` name is `hakoniwa-term`).
- Run `pnpm install` once, then `pnpm build` so `dist/` matches `src/`.
- Drive headless with `pnpm vitest run src/Terminal.test.tsx` (jsdom, no server).
- Only start the playground (`example/hakoniwa-sample-3`, `pnpm dev --port 5199 --strictPort`)
  when the feature file explicitly asks for a visual check.
- Run `node .opencode/skills/verify-hakoniwa-term/scripts/doctor.mjs` and require READY.
- Never drive an instance that was not started by this verification run.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- Treat every command as literal. Keep quoted `-t` filters and role names unchanged.
- Run headless actions through vitest: `pnpm vitest run src/Terminal.test.tsx -t "<filter>"`.
- Run the scripted wrapper as
  `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "<filter>" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`.
- Restore nothing (tests are jsdom-isolated); do not remove proof artifacts during cleanup.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- Headless proof includes the vitest transcript, exit code, and the echoed history lines.
- Visual proof includes a DOM excerpt and a screenshot with the playground identity visible.
- Mutation proof includes a read-only second query of the same state (e.g. `queryByText`
  after `clear`, progress gone after completion).
- Record the feature ID and entry point used with every artifact.
- Report an unreachable path with the attempted command and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing the user-visible behavior. It then uses exactly four H2 sections in this order.

1. `Sub-features` lists short IDs with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with <harness>` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

Keep implementation details out of the map. Name only user paths, stable handles, required state, commands, and observable proof.

## Features

- [Run a command](./run-command.md) covers typing, Enter/button submit, echo, unknown, empty, and clear.
- [Stream logs and progress](./stream-progress.md) covers async-generator streaming, the progress bar, and system locking.
- [Themes and presets](./theme-preset.md) covers the 6 presets, partial overrides, and CSS variables.
- [Window chrome](./window-chrome.md) covers title, close button, header actions, and input focus.
