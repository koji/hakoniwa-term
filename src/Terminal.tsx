import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, X } from 'lucide-react';
import styles from './Terminal.module.css';

export interface CommandLog {
  type: 'input' | 'output' | 'error' | 'success';
  text: string;
}

export type YieldChunk =
  | { type: 'log'; log: CommandLog }
  | { type: 'progress'; percent: number; text?: string };

export type CommandAction = (args: string[]) => AsyncGenerator<YieldChunk, void, unknown>;

/**
 * ターミナルのカラーテーマのインターフェース（主要8色）
 */
export interface TerminalTheme {
  bg: string;
  titleBg: string;
  border: string;
  text: string;
  prompt: string;
  error: string;
  success: string;
  progress: string;
}

/**
 * 組み込みプリセットの識別名
 */
export type TerminalPreset = 'emerald' | 'matrix' | 'dracula' | 'amber' | 'cyberpunk' | 'light';

/**
 * 組み込みプリセット定義
 */
export const TERMINAL_PRESETS: Record<TerminalPreset, TerminalTheme> = {
  emerald: {
    bg: 'rgba(9, 10, 15, 0.95)',
    titleBg: '#0e1017',
    border: 'rgba(16, 185, 129, 0.3)',
    text: 'rgba(52, 211, 153, 0.9)',
    prompt: '#10b981',
    error: '#f87171',
    success: '#6ee7b7',
    progress: '#10b981',
  },
  matrix: {
    bg: '#000000',
    titleBg: '#051105',
    border: '#00ff41',
    text: '#00ff41',
    prompt: '#00ff41',
    error: '#ff0033',
    success: '#00ff41',
    progress: '#00ff41',
  },
  dracula: {
    bg: '#282a36',
    titleBg: '#21222c',
    border: '#6272a4',
    text: '#f8f8f2',
    prompt: '#50fa7b',
    error: '#ff5555',
    success: '#50fa7b',
    progress: '#bd93f9',
  },
  amber: {
    bg: '#1a0f00',
    titleBg: '#2b1a00',
    border: '#ffb000',
    text: '#ffb000',
    prompt: '#ffc107',
    error: '#ff5252',
    success: '#ffb000',
    progress: '#ffb000',
  },
  cyberpunk: {
    bg: '#0d0f18',
    titleBg: '#16192b',
    border: '#00f0ff',
    text: '#00f0ff',
    prompt: '#ffe600',
    error: '#ff0055',
    success: '#00ff9f',
    progress: '#ff0055',
  },
  light: {
    bg: '#ffffff',
    titleBg: '#f3f4f6',
    border: '#e5e7eb',
    text: '#1f2937',
    prompt: '#059669',
    error: '#dc2626',
    success: '#059669',
    progress: '#059669',
  },
};

export interface TerminalProps {
  promptString?: string;
  placeholder?: string;
  systemLockedText?: string;
  commandNotFoundFormatter?: (cmd: string) => string;
  initialHistory?: CommandLog[];
  commands: Record<string, CommandAction>;
  title?: React.ReactNode;
  showCloseButton?: boolean;
  onClose?: () => void;
  headerRightActions?: React.ReactNode;
  /** プリセットテーマ指定 */
  preset?: TerminalPreset;
  /** カスタムテーマによる部分オーバーライド */
  theme?: Partial<TerminalTheme>;
}

export default function Terminal({
  promptString = 'user@terminal:~$',
  placeholder = 'Type a command...',
  systemLockedText = 'System locked during execution...',
  commandNotFoundFormatter = (cmd) => `Command not found: "${cmd}".`,
  initialHistory = [],
  commands,
  title = 'terminal',
  showCloseButton = true,
  onClose,
  headerRightActions,
  preset = 'emerald',
  theme,
}: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandLog[]>(initialHistory);

  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [progressText, setProgressText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // プリセットとカスタムthemeのマージによるCSS変数の動的注入計算
  const dynamicStyles = useMemo(() => {
    const baseTheme = TERMINAL_PRESETS[preset] || TERMINAL_PRESETS.emerald;
    const finalTheme = { ...baseTheme, ...theme };

    return {
      '--terminal-bg': finalTheme.bg,
      '--terminal-title-bg': finalTheme.titleBg,
      '--terminal-border': finalTheme.border,
      '--terminal-text': finalTheme.text,
      '--terminal-prompt': finalTheme.prompt,
      '--terminal-error': finalTheme.error,
      '--terminal-success': finalTheme.success,
      '--terminal-progress': finalTheme.progress,
    } as React.CSSProperties;
  }, [preset, theme]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history, syncProgress, progressText, isSystemLocked]);

  const handleTerminalClick = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isSystemLocked) return;

    setHistory((prev) => [...prev, { type: 'input', text: `${promptString} ${trimmedInput}` }]);
    setInput('');

    const args = trimmedInput.split(' ');
    const primaryCmd = args[0].toLowerCase();

    if (primaryCmd === 'clear') {
      setHistory([]);
      return;
    }

    if (commands && commands[primaryCmd]) {
      setIsSystemLocked(true);
      try {
        const generator = commands[primaryCmd](args);

        for await (const chunk of generator) {
          if (chunk.type === 'log') {
            setHistory((prev) => [...prev, chunk.log]);
          } else if (chunk.type === 'progress') {
            setSyncProgress(chunk.percent);
            if (chunk.text) setProgressText(chunk.text);
          }
        }
      } catch (err) {
        setHistory((prev) => [
          ...prev,
          { type: 'error', text: `Execution error: ${err instanceof Error ? err.message : String(err)}` },
        ]);
      } finally {
        setIsSystemLocked(false);
        setSyncProgress(null);
        setProgressText('');
      }
    } else {
      setHistory((prev) => [...prev, { type: 'error', text: commandNotFoundFormatter(primaryCmd) }]);
    }
  };

  const getLogClass = (type: CommandLog['type']) => {
    if (type === 'input') return styles.logInput;
    if (type === 'error') return styles.logError;
    if (type === 'success') return styles.logSuccess;
    return styles.logOutput;
  };

  return (
    <div
      className={styles.terminalRoot}
      style={dynamicStyles}
      onClick={handleTerminalClick}
    >
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <TerminalIcon className="w-4 h-4" style={{ color: 'var(--terminal-prompt)' }} />
          <span className={styles.titleText}>{title}</span>
        </div>
        <div className={styles.titleRight}>
          {headerRightActions}
          {showCloseButton && onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className={styles.closeButton}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className={styles.contentBox}>
        {history.map((log, index) => (
          <div key={index} className={`${styles.logRow} ${getLogClass(log.type)}`}>
            {log.text}
          </div>
        ))}

        {syncProgress !== null && (
          <div className={styles.progressBarContainer}>
            <div className={styles.progressHeader}>
              <span>{progressText}</span>
              <span>{syncProgress}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: `${syncProgress}%` }} />
            </div>
          </div>
        )}

        <form onSubmit={handleCommand} className={styles.inputForm}>
          <span className={styles.prompt}>{promptString}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSystemLocked}
            placeholder={isSystemLocked ? systemLockedText : placeholder}
            className={styles.inputField}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button type="submit" className={styles.submitButton}>
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
