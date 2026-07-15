import React from 'react';
// ローカルリンクしたパッケージから名前付きエクスポートで取得
import { Terminal, CommandAction } from 'kuro-gamen';
// パッケージのスタイルを手動インポート
import 'kuro-gamen/dist/index.css';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function App() {
  // 検証用のカスタムコマンドマップ
  const testCommands: Record<string, CommandAction> = {
    help: async function* () {
      yield { type: 'log', log: { type: 'output', text: '=== Available Test Routines ===' } };
      yield { type: 'log', log: { type: 'output', text: '  hello  - Print a simple greeting' } };
      yield { type: 'log', log: { type: 'output', text: '  async  - Simulate an asynchronous chunked heavy process' } };
      yield { type: 'log', log: { type: 'output', text: '  error  - Trigger a test error trace' } };
    },

    hello: async function* (args) {
      const target = args[1] || 'Guest';
      yield { type: 'log', log: { type: 'success', text: `✨ Hello, ${target}! kuro-gamen engine is running successfully.` } };
    },

    // 最も重要な AsyncGenerator による段階的プログレスバーの検証
    async: async function* () {
      yield { type: 'log', log: { type: 'output', text: 'Initializing sub-routine...' } };

      await delay(500);
      yield { type: 'progress', percent: 20, text: 'Fetching metadata streams...' };

      await delay(500);
      yield { type: 'progress', percent: 50, text: 'Parsing binary components...' };

      await delay(500);
      yield { type: 'progress', percent: 85, text: 'Optimizing terminal layout...' };

      await delay(500);
      yield { type: 'progress', percent: 100, text: 'Task completed' };
      yield { type: 'log', log: { type: 'success', text: '✨ SUCCESS: All local sync procedures verified!' } };
    },

    error: async function* () {
      yield { type: 'log', log: { type: 'error', text: '❌ CRITICAL: Simulated sub-system overflow detected.' } };
    }
  };

  return (
    <div style={{
      padding: '3rem',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#020204',
      minHeight: '100vh'
    }}>
      <Terminal
        title="kuro-gamen@local-test:~"
        promptString="tester@kuro-gamen:~$ "
        placeholder="Type 'help', 'hello [name]', or 'async'..."
        initialHistory={[
          { type: 'success', text: '=== KURO-GAMEN ENGINE LOCAL TEST SUITE ===' },
          { type: 'output', text: 'Package successfully bundled via Vite & CSS Modules.' },
          { type: 'output', text: 'Ready for pluggable command injection.' }
        ]}
        commands={testCommands}
        onClose={() => alert('Terminal session closed.')}
      />
    </div>
  );
}
