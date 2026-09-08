# Stream logs and progress

Streaming lets a command defined as `async function*` yield log rows over time and live progress updates, with the input locked until the generator finishes and the progress bar removed on completion.

## Sub-features

- `stream-logs` appends each yielded `log` chunk as a history row.
- `stream-progress` shows progress text plus `<percent>%` while a `progress` chunk is active.
- `stream-complete` removes the progress bar and re-enables input when the generator returns.
- `stream-lock` disables the input with `systemLockedText` during execution and ignores new submissions.
- `stream-error` renders `Execution error: <message>` when the generator throws.

## How to get to it (user POV)

- Type a streaming command name (e.g. `deploy` in the playground) and press Enter.
- Watch the progress header update (`Building assets... 15%`, ...) while logs stream in.
- Try typing mid-run: the field is disabled and shows the locked placeholder.

## Driving it with vitest

Preconditions:

- Doctor reports READY at the repo root.
- No demo server needed; gated-promise generators simulate the slow path deterministically.

- **Stream logs.** Submit a two-yield `help` generator. Run `pnpm vitest run src/Terminal.test.tsx -t "streams logs yielded by an async generator" --reporter=verbose`. Both `line one` and `line two` appear in history.
- **Show progress.** Submit a generator that yields `{ percent: 42, text: "Uploading..." }` then gates. Run `pnpm vitest run src/Terminal.test.tsx -t "shows progress text and percentage" --reporter=verbose`. `Uploading...` and `42%` are visible mid-run, `upload complete` appears after release, and `42%` is then absent.
- **Lock input.** Submit a gated `slow` command. Run `pnpm vitest run src/Terminal.test.tsx -t "disables input with systemLockedText" --reporter=verbose`. The textbox `toBeDisabled()` with the locked placeholder (`LOCKED` in the test, `System locked during execution...` by default), then re-enabled with `finally done` visible after release.
- **Ignore while locked.** Submit twice during a gated run. Run `pnpm vitest run src/Terminal.test.tsx -t "ignores submissions while locked" --reporter=verbose`. Exactly one `user@terminal:~$ slow` history row exists.
- **Playground visual (optional).** Start `pnpm dev --port 5199 --strictPort` in `example/hakoniwa-sample-3`, open `http://localhost:5199/`, submit `deploy`. Progress steps (`Building assets...`, `Running test suite...`, ...) stream over ~3s and end with status 200 OK. Capture a DOM excerpt plus a screenshot showing the playground heading.
- **Proof.** Re-run one slice through the wrapper. Run `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "shows progress text and percentage" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`. The transcript shows exit 0 and `result.json` records feature ID `stream-progress` with the Enter entry point.

## Gotchas

- Progress state is singular (`syncProgress`): concurrent commands cannot each own a bar because input is locked during execution.
- Assert both halves: progress visible mid-run AND gone after completion; a mid-run screenshot alone proves nothing about cleanup.
- The playground `deploy` sleeps ~600ms per step; in vitest prefer the gated generator over real timers.
- `progressText` persists until `finally` clears it; asserting stale text after completion is a false failure if you query before the generator returns.
- Errors thrown inside the generator render as `Execution error: ...`, not via `commandNotFoundFormatter`.
