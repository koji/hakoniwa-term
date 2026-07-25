import './App.css'
import { Terminal } from 'hakoniwa-term';
import type { CommandAction } from 'hakoniwa-term';

import 'hakoniwa-term/dist/index.css';


export default function App() {
  const commands: Record<string, CommandAction> = {
    hello: async function* (args) {
      const name = args[1] || 'Guest';
      yield {
        type: 'log',
        log: { type: 'success', text: `✨ ようこそ、${name} さん！` },
      };
    },

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
        placeholder="コマンドを入力 ('hello [名前]' や 'system')..."
        commands={commands}
      />
    </div>
  );
}
