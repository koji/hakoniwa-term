import { useState } from 'react';
import { Terminal, TERMINAL_PRESETS } from 'hakoniwa-term';
import type { CommandAction, TerminalPreset } from 'hakoniwa-term';
import 'hakoniwa-term/dist/index.css';


export default function TerminalPlayground() {
  const [currentPreset, setCurrentPreset] = useState<TerminalPreset>('dracula');
  const [useCustomTheme, setUseCustomTheme] = useState(false);
  const [customPromptColor, setCustomPromptColor] = useState('#ff0055');

  // インタラクティブなコマンド群の定義
  const commands: Record<string, CommandAction> = {
    // 1. ヘルプ & 各種ログ出力デモ
    help: async function* () {
      yield {
        type: 'log',
        log: { type: 'output', text: 'Terminal Demo - Available commands:' },
      };
      yield {
        type: 'log',
        log: { type: 'output', text: '  help            - Show this help message' },
      };
      yield {
        type: 'log',
        log: { type: 'output', text: '  preset <name>   - Change preset (emerald, matrix, dracula, amber, cyberpunk, light)' },
      };
      yield {
        type: 'log',
        log: { type: 'output', text: '  deploy          - Simulate an async task with progress bar' },
      };
      yield {
        type: 'log',
        log: { type: 'output', text: '  clear           - Clear terminal history' },
      };
      yield {
        type: 'log',
        log: { type: 'success', text: '[SUCCESS] Command menu rendered successfully.' },
      };
    },

    // 2. ターミナル内から親の Preset 状態を変更するコマンド
    preset: async function* (args: string[]) {
      const targetPreset = args[1]?.toLowerCase() as TerminalPreset;

      if (!targetPreset) {
        yield {
          type: 'log',
          log: { type: 'output', text: `Current preset: "${currentPreset}"` },
        };
        yield {
          type: 'log',
          log: {
            type: 'output',
            text: `Available options: ${Object.keys(TERMINAL_PRESETS).join(', ')}`,
          },
        };
        return;
      }

      if (TERMINAL_PRESETS[targetPreset]) {
        setCurrentPreset(targetPreset);
        yield {
          type: 'log',
          log: { type: 'success', text: `Preset successfully changed to "${targetPreset}".` },
        };
      } else {
        yield {
          type: 'log',
          log: {
            type: 'error',
            text: `Invalid preset "${targetPreset}". Valid presets: ${Object.keys(TERMINAL_PRESETS).join(', ')}`,
          },
        };
      }
    },

    // 3. 非同期ストリーミング・プログレスバーデモ
    deploy: async function* () {
      yield {
        type: 'log',
        log: { type: 'output', text: 'Initializing deployment pipeline...' },
      };

      const steps = [
        { percent: 15, text: 'Building assets...' },
        { percent: 45, text: 'Running test suite...' },
        { percent: 75, text: 'Uploading artifacts...' },
        { percent: 90, text: 'Verifying health checks...' },
        { percent: 100, text: 'Deployment finalized!' },
      ];

      for (const step of steps) {
        // 非同期処理（API通信や重い処理のシミュレーション）
        await new Promise((resolve) => setTimeout(resolve, 600));

        // 進捗バーの更新を yield
        yield {
          type: 'progress',
          percent: step.percent,
          text: step.text,
        };

        // ログメッセージの出力も随時 yield
        yield {
          type: 'log',
          log: { type: 'output', text: `[STEP] ${step.text}` },
        };
      }

      yield {
        type: 'log',
        log: { type: 'success', text: '🚀 Deployment finished with status 200 OK!' },
      };
    },
  };

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f3f4f6' }}>
          Terminal Preset Playground
        </h2>

        <div style={controlGroupStyle}>
          {/* Preset 選択ドロップダウン */}
          <label style={labelStyle}>
            Preset:
            <select
              value={currentPreset}
              onChange={(e) => setCurrentPreset(e.target.value as TerminalPreset)}
              style={selectStyle}
            >
              {Object.keys(TERMINAL_PRESETS).map((presetName) => (
                <option key={presetName} value={presetName}>
                  {presetName}
                </option>
              ))}
            </select>
          </label>

          {/* カスタム Prompt カラーの上書きトグル */}
          <label style={labelStyle}>
            <input
              type="checkbox"
              checked={useCustomTheme}
              onChange={(e) => setUseCustomTheme(e.target.checked)}
              style={{ marginRight: '0.375rem' }}
            />
            Override Prompt Color:
          </label>

          {useCustomTheme && (
            <input
              type="color"
              value={customPromptColor}
              onChange={(e) => setCustomPromptColor(e.target.value)}
              style={colorPickerStyle}
            />
          )}
        </div>
      </header>

      {/* ターミナルコンポーネント本体 */}
      <Terminal
        title={`terminal -- preset: ${currentPreset}`}
        preset={currentPreset}
        theme={useCustomTheme ? { prompt: customPromptColor } : undefined}
        commands={commands}
        initialHistory={[
          { type: 'output', text: 'Welcome to Terminal Playground!' },
          { type: 'output', text: 'Type "help" to view available commands.' },
        ]}
      />
    </div>
  );
}

// 簡単なレイアウト用インラインスタイル
const containerStyle: React.CSSProperties = {
  padding: '2rem',
  backgroundColor: '#090a0f',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1.5rem',
  boxSizing: 'border-box',
};

const headerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '56rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  padding: '1rem',
  backgroundColor: '#111827',
  borderRadius: '0.5rem',
  border: '1px solid #374151',
};

const controlGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const labelStyle: React.CSSProperties = {
  color: '#d1d5db',
  fontSize: '0.875rem',
  display: 'flex',
  alignItems: 'center',
};

const selectStyle: React.CSSProperties = {
  marginLeft: '0.5rem',
  padding: '0.25rem 0.5rem',
  backgroundColor: '#1f2937',
  color: '#f3f4f6',
  border: '1px solid #4b5563',
  borderRadius: '0.25rem',
  cursor: 'pointer',
};

const colorPickerStyle: React.CSSProperties = {
  border: 'none',
  width: '1.75rem',
  height: '1.75rem',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  backgroundColor: 'transparent',
};
