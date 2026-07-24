# hakoniwa-term (箱庭-term)

> A programmable, retro hacker-style terminal UI engine for React applications, powered by Async Generators and CSS Modules with total style isolation.

[English](README.md) | [日本語](README_JP.md)

[![npm version](https://img.shields.io/npm/v/hakoniwa-term.svg)](https://www.npmjs.com/package/hakoniwa-term)
[![license](https://img.shields.io/npm/l/hakoniwa-term.svg)](LICENSE)

---

## 🪴 What is Hakoniwa (箱庭)?

> In Japanese, **「箱庭（はこにわ / hakoniwa）」** literally means *“box garden.”*  
> It refers to a small, self-contained miniature garden or landscape arranged inside a box or tray—like tiny rocks, plants, and buildings forming a little self-contained world you can observe and interact with.

`hakoniwa-term` brings that miniature, self-contained concept to terminal UIs in React.

---

## 📷 Screenshot & Demo

![screenshot](resources/screenshot_hakoniwa_term.png)

- **Live CodeSandbox Demo**: [Try on CodeSandbox](https://codesandbox.io/p/sandbox/my9kn2)

---

## ✨ Features

- ⚡ **Async Generator Commands**: Easily stream logs, output step-by-step responses, or trigger real-time progress bar animations using simple `async function*` yield syntax.
- 🎨 **Retro Hacker Design**: Dark aesthetic inspired by classic CLI environments.
- 🔒 **Style Isolation**: Built using CSS Modules—zero CSS leaks into your global styles or main app layout.
- ⏳ **Built-in Progress Bar**: Stream live `%` progress updates directly from command generators.
- 🔐 **System Locking**: Disables input during command execution to prevent race conditions.
- 🧹 **Built-in Utilities**: Automatic `clear` command support.
- 📘 **TypeScript Native**: Full type safety for props, logs, yield chunks, and command handlers.

---

## 📦 Installation

Install `hakoniwa-term` using your favorite package manager:

```bash
npm install hakoniwa-term lucide-react
# or
pnpm add hakoniwa-term lucide-react
# or
yarn add hakoniwa-term lucide-react
```

> **Note**: `lucide-react` is required for terminal icons. `react` and `react-dom` (>= 18.0.0) are peer dependencies.

---

## 🚀 Quick Start

1. Import the `Terminal` component.
2. Import the bundled CSS stylesheet (`hakoniwa-term/dist/index.css`).
3. Map your commands using async generator functions.

```tsx
import React from 'react';
import { Terminal, CommandAction } from 'hakoniwa-term';
import 'hakoniwa-term/dist/index.css';

export default function App() {
  const commands: Record<string, CommandAction> = {
    // Simple greeting command
    hello: async function* (args) {
      const name = args[1] || 'Guest';
      yield {
        type: 'log',
        log: { type: 'success', text: `✨ Welcome aboard, ${name}!` },
      };
    },

    // Info command
    system: async function* () {
      yield {
        type: 'log',
        log: { type: 'output', text: 'System status: Operational' },
      };
      yield {
        type: 'log',
        log: { type: 'output', text: 'Kernel: hakoniwa-v0.0.3' },
      };
    },
  };

  return (
    <div style={{ padding: '2rem', height: '100vh', background: '#020204' }}>
      <Terminal
        title="guest@hakoniwa:~"
        promptString="user@hakoniwa:~$ "
        placeholder="Type 'hello [name]' or 'system'..."
        commands={commands}
      />
    </div>
  );
}
```

---

## 💡 Advanced Usage: Streaming Logs & Progress Bars

`hakoniwa-term` commands leverage JavaScript **Async Generators** (`async function*`). This allows long-running or multi-stage asynchronous tasks to progressively stream log messages and update an integrated progress bar.

### Example: Multi-step Async Command with Progress Updates

```tsx
import { Terminal, CommandAction } from 'hakoniwa-term';
import 'hakoniwa-term/dist/index.css';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const commands: Record<string, CommandAction> = {
  sync: async function* () {
    // 1. Stream log output
    yield {
      type: 'log',
      log: { type: 'output', text: 'Connecting to remote repository...' },
    };

    // 2. Stream progress (20%)
    await delay(500);
    yield { type: 'progress', percent: 20, text: 'Fetching remote refs...' };

    // 3. Stream progress (65%)
    await delay(500);
    yield { type: 'progress', percent: 65, text: 'Unpacking objects...' };

    // 4. Stream progress (100%)
    await delay(500);
    yield { type: 'progress', percent: 100, text: 'Finalizing sync procedure...' };

    // 5. Stream final success log
    yield {
      type: 'log',
      log: { type: 'success', text: '✨ Repository synchronized successfully!' },
    };
  },

  errorTest: async function* () {
    yield {
      type: 'log',
      log: { type: 'error', text: '❌ CRITICAL: Unauthorized access detected!' },
    };
  },
};
```

---

## 🎛️ Component API (`TerminalProps`)

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `commands` | `Record<string, CommandAction>` | **Required** | Map of command names to async generator handlers. |
| `promptString` | `string` | `'user@terminal:~$'` | The prompt prefix displayed before user input. |
| `placeholder` | `string` | `'Type a command...'` | Placeholder text for the input box. |
| `systemLockedText` | `string` | `'System locked during execution...'` | Placeholder shown while an async command is executing. |
| `title` | `React.ReactNode` | `'terminal'` | Header title string or custom React element. |
| `initialHistory` | `CommandLog[]` | `[]` | Pre-populated log items displayed when mounted. |
| `showCloseButton` | `boolean` | `true` | Whether to render the window close button (`X`). |
| `onClose` | `() => void` | `undefined` | Callback invoked when the close button is clicked. |
| `headerRightActions` | `React.ReactNode` | `undefined` | Custom React nodes rendered in the top-right of the title bar. |
| `commandNotFoundFormatter` | `(cmd: string) => string` | `(cmd) => Command not found: "${cmd}".` | Formatter function for unknown commands. |

---

## 📐 TypeScript Types & Interfaces

```typescript
export interface CommandLog {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export type YieldChunk =
  | { type: 'log'; log: CommandLog }
  | { type: 'progress'; percent: number; text?: string };

export type CommandAction = (args: string[]) => AsyncGenerator<YieldChunk, void, unknown>;
```

---

## 📜 License

[MIT](LICENSE) © [koji](https://github.com/koji)
