import React, { useState, useRef, useEffect } from 'react';
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
}: TerminalProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandLog[]>(initialHistory);

  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [progressText, setProgressText] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className={styles.terminalRoot} onClick={handleTerminalClick}>
      <div className={styles.titleBar}>
        <div className={styles.titleLeft}>
          <TerminalIcon className="w-4 h-4" style={{ color: '#10b981' }} />
          <span className={styles.titleText}>{title}</span>
        </div>
        <div className={styles.titleRight}>
          {headerRightActions}
          {showCloseButton && onClose && (
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={styles.closeButton}>
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
