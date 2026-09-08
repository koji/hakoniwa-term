# Run a command

Run a command lets a user type into the terminal input, submit with Enter or the Run button, see the command echoed with the prompt prefix, and get output, an unknown-command error, or a cleared history.

## Sub-features

- `run-type-submit` types a command and submits with Enter.
- `run-button-submit` submits the same input via the Run command button.
- `run-echo` echoes `"<prompt> <command>"` into history and clears the field.
- `run-unknown` reports unknown commands through `commandNotFoundFormatter`.
- `run-empty` ignores empty submissions (no history row added).
- `run-clear` empties history via the built-in `clear`.

## How to get to it (user POV)

- Focus the terminal textbox and press Enter after typing (placeholder `Type a command...` by default).
- Click the `Run command` submit button next to the input.
- In the playground, type `help` and submit to list demo commands.

## Driving it with vitest

Preconditions:

- Doctor reports READY at the repo root.
- No demo server needed; all bullets are jsdom headless.

- **Type and submit.** Focus the textbox, type, press Enter. Run `pnpm vitest run src/Terminal.test.tsx -t "echoes submitted commands" --reporter=verbose`. The history shows `user@t:~$ hello world` and the input value is empty.
- **Submit via button.** Type then click Run. Run `pnpm vitest run src/Terminal.test.tsx -t "submits via the Run command button" --reporter=verbose`. The history shows `p:~$ via-button`.
- **Unknown command.** Submit an unmapped name. Run `pnpm vitest run src/Terminal.test.tsx -t "reports unknown commands" --reporter=verbose`. The formatter receives the bare name and the history shows its message (default `Command not found: "<cmd>".`).
- **Empty submit.** Submit with an empty field. Run `pnpm vitest run src/Terminal.test.tsx -t "does nothing when submitting an empty command" --reporter=verbose`. No `"<prompt> ..."` history row appears.
- **Clear.** Seed `initialHistory` then submit `clear`. Run `pnpm vitest run src/Terminal.test.tsx -t "clears history when the built-in clear" --reporter=verbose`. The seeded text is absent via `queryByText`.
- **Rapid repeats.** Submit two commands back to back. Run `pnpm vitest run src/Terminal.test.tsx -t "handles rapid consecutive submissions" --reporter=verbose`. Both outputs (`echo one`, `echo two`) are present.
- **Proof.** Re-run one slice through the wrapper. Run `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "echoes submitted commands" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`. The `vitest-transcript.txt` shows exit 0 and `result.json` records the feature ID `run-echo` with the Enter entry point.

## Gotchas

- Matching is on the lowercased first token (`FROBNICATE` hits `frobnicate`); splitting is on single spaces.
- `clear` bypasses `commands` entirely: a user-defined `clear` handler never runs.
- Empty means `input.trim()` is empty; whitespace-only input adds no history row.
- The echo row is `input` type (`promptString + " " + trimmedInput`); assert the full string including the prompt.
- A status line alone is insufficient proof: assert the echoed row plus the output row.
