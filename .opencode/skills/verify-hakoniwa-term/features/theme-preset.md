# Themes and presets

Themes let a user pick one of 6 built-in presets (`emerald`, `matrix`, `dracula`, `amber`, `cyberpunk`, `light`) and optionally override individual colors via the `theme` prop, applied as CSS variables on the terminal root.

## Sub-features

- `theme-preset` applies a preset's 8 colors as `--terminal-*` variables on the root element.
- `theme-override` merges `theme` over the preset, replacing only the given keys.
- `theme-playground` switches presets live from the `preset <name>` command or the `Preset:` select.

## How to get to it (user POV)

- Pass `preset="matrix"` (or any of the 6 names) to `<Terminal>`.
- Pass `theme={{ prompt: "#ff0055" }}` alongside a preset for a partial override.
- In the playground, run `preset cyberpunk` in the terminal or pick from the `Preset:` dropdown.

## Driving it with vitest

Preconditions:

- Doctor reports READY at the repo root.
- No demo server needed except for the `theme-playground` bullet.

- **Apply preset.** Render with `preset="matrix"`. Run `pnpm vitest run src/Terminal.test.tsx -t "applies preset theme CSS variables" --reporter=verbose`. The root element's `--terminal-bg` equals `TERMINAL_PRESETS.matrix.bg` and `--terminal-text` equals `TERMINAL_PRESETS.matrix.text`.
- **Partial override.** Render with `preset="matrix"` plus `theme={{ prompt: "#ff0055" }}`. Run `pnpm vitest run src/Terminal.test.tsx -t "lets a custom theme override" --reporter=verbose`. `--terminal-prompt` is `#ff0055` while `--terminal-text` stays the matrix value.
- **Playground switch (visual).** Start `pnpm dev --port 5199 --strictPort` in `example/hakoniwa-sample-3`, open `http://localhost:5199/`, submit `preset amber`. The title becomes `terminal -- preset: amber` and a success line `Preset successfully changed to "amber".` appears. Submit `preset nonsense` to see the error line listing valid presets.
- **Proof.** Re-run one slice through the wrapper. Run `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "lets a custom theme override" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`. The transcript shows exit 0 and `result.json` records feature ID `theme-override` with the props entry point.

## Gotchas

- Unknown preset names fall back to `emerald` (`TERMINAL_PRESETS[preset] || emerald`); assert the fallback, not a crash.
- CSS-module class names are hashed per build: assert `--terminal-*` inline variables on the root, never class names.
- In the playground, `preset` with no args prints the current preset plus options; it does not change state.
- The `theme` prop is a shallow merge: nested objects are not deep-merged (all values are flat color strings).
- The color-picker override only renders while `Override Prompt Color` is checked in the playground header.
