# Window chrome

Window chrome is the terminal frame around the history: the title bar with icon and title text, the optional close button, custom header actions, and click-to-focus plus placeholder behavior of the input.

## Sub-features

- `chrome-title` renders the `title` prop (string or node) next to the terminal icon.
- `chrome-close` renders a `Close terminal` button only when `onClose` is set (and `showCloseButton` is not false), calling `onClose` once per click without refocusing the input.
- `chrome-actions` renders `headerRightActions` nodes inside the title bar.
- `chrome-focus` moves focus to the input when clicking the terminal body, but not when clicking buttons.
- `chrome-placeholder` shows `placeholder` when idle and `systemLockedText` while locked.

## How to get to it (user POV)

- Look at the title bar: icon, title text, and (if configured) extra actions and the X button.
- Click anywhere in the terminal body: the input gains focus.
- Click the X (accessible name `Close terminal`): the host's `onClose` runs.
- Type while a command executes: the locked placeholder explains the disabled input.

## Driving it with vitest

Preconditions:

- Doctor reports READY at the repo root.
- No demo server needed; all bullets are jsdom headless.

- **Title.** Render with `title="my-terminal"`. Run `pnpm vitest run src/Terminal.test.tsx -t "renders the title text" --reporter=verbose`. `my-terminal` is in the document.
- **Seeded history.** Render with `initialHistory` output + error rows. Run `pnpm vitest run src/Terminal.test.tsx -t "renders initialHistory entries" --reporter=verbose`. Both `Welcome!` and `Something broke` are visible.
- **Prompt and placeholder.** Render with custom strings. Run `pnpm vitest run src/Terminal.test.tsx -t "renders the prompt string and custom placeholder" --reporter=verbose`. `dev@box:~$` text and the `Type here...` placeholder are present.
- **Accessible names.** Render with `onClose`. Run `pnpm vitest run src/Terminal.test.tsx -t "gives the icon-only close and submit buttons accessible names" --reporter=verbose`. Both `Close terminal` and `Run command` buttons exist.
- **Click to focus.** Click the root element. Run `pnpm vitest run src/Terminal.test.tsx -t "focuses the input when clicking" --reporter=verbose`. The textbox `toHaveFocus()`, including after rerender (`keeps focusing the input after rerender`).
- **Close behavior.** Click the close button / render without `onClose` / with `showCloseButton={false}`. Run `pnpm vitest run src/Terminal.test.tsx -t "close button" --reporter=verbose`. `onClose` fires exactly once, is hidden in both opt-outs, and the click does not refocus the input.
- **Proof.** Re-run one slice through the wrapper. Run `node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "gives the icon-only close" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>`. The transcript shows exit 0 and `result.json` records feature ID `chrome-close` with the button entry point.

## Gotchas

- The close button needs BOTH `onClose` and `showCloseButton !== false`; either opt-out hides it.
- Body-click focus is a native delegated listener that skips `closest("button")`: clicking Run/Close never focuses the input, by design.
- `headerRightActions` render even when the close button is hidden; assert them via `data-testid`, not position.
- `title` accepts any `ReactNode`, so custom elements render verbatim; assert their test IDs, not text.
- Placeholder flips to `systemLockedText` while locked: asserting the idle `placeholder` mid-run is a false failure.
