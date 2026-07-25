import React from 'react';
import { Terminal } from 'hakoniwa-term';
import type { CommandAction } from 'hakoniwa-term';
import 'hakoniwa-term/dist/index.css';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const commands: Record<string, CommandAction> = {
  sync: async function* () {
    // 1. ログ出力
    yield {
      type: 'log',
      log: { type: 'output', text: 'リモートリポジトリに接続中...' },
    };

    // 2. プログレス更新 (20%)
    await delay(500);
    yield { type: 'progress', percent: 20, text: 'リモート参照を取得中...' };

    // 3. プログレス更新 (65%)
    await delay(500);
    yield { type: 'progress', percent: 65, text: 'オブジェクトを展開中...' };

    // 4. プログレス更新 (100%)
    await delay(500);
    yield { type: 'progress', percent: 100, text: '同期処理を完了中...' };

    // 5. 最終成功ログを出力
    yield {
      type: 'log',
      log: { type: 'success', text: '✨ リポジトリの同期が正常に完了しました！' },
    };
  },

  errorTest: async function* () {
    yield {
      type: 'log',
      log: { type: 'error', text: '❌ エラー: 不正なアクセスが検出されました！' },
    };
  },
};

export default function App() {
  return (
    <div style={{ padding: '2rem', height: '100vh', background: '#020204' }}>
      <Terminal
        title="sync-routine@hakoniwa:~"
        promptString="user@hakoniwa:~$ "
        placeholder="コマンドを入力 ('sync' や 'errorTest')..."
        commands={commands}
      />
    </div>
  );
}
