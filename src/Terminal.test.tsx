import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Terminal, { TERMINAL_PRESETS } from './Terminal';
import type { CommandAction, CommandLog } from './Terminal';

/** 入力欄を取得し、コマンドを送信するヘルパー */
async function typeAndRun(command: string) {
  const user = userEvent.setup();
  const input = screen.getByRole('textbox');
  await user.clear(input);
  if (command.length > 0) {
    await user.type(input, command);
  }
  await user.keyboard('{Enter}');
  return input;
}

describe('Terminal - rendering', () => {
  const noopCommands: Record<string, CommandAction> = {};

  it('renders the title text', () => {
    render(<Terminal title="my-terminal" commands={noopCommands} />);
    expect(screen.getByText('my-terminal')).toBeInTheDocument();
  });

  it('renders initialHistory entries', () => {
    const initialHistory: CommandLog[] = [
      { type: 'output', text: 'Welcome!' },
      { type: 'error', text: 'Something broke' },
    ];
    render(<Terminal commands={noopCommands} initialHistory={initialHistory} />);
    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByText('Something broke')).toBeInTheDocument();
  });

  it('renders the prompt string and custom placeholder', () => {
    render(
      <Terminal commands={noopCommands} promptString="dev@box:~$" placeholder="Type here..." />,
    );
    expect(screen.getByText('dev@box:~$')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('applies preset theme CSS variables to the root element', () => {
    const { container } = render(<Terminal preset="matrix" commands={noopCommands} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--terminal-bg')).toBe(TERMINAL_PRESETS.matrix.bg);
    expect(root.style.getPropertyValue('--terminal-text')).toBe(TERMINAL_PRESETS.matrix.text);
  });

  it('lets a custom theme override preset variables', () => {
    const { container } = render(
      <Terminal preset="matrix" theme={{ prompt: '#ff0055' }} commands={noopCommands} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.getPropertyValue('--terminal-prompt')).toBe('#ff0055');
    // 上書きされていない変数はプリセットのまま
    expect(root.style.getPropertyValue('--terminal-text')).toBe(TERMINAL_PRESETS.matrix.text);
  });

  it('renders headerRightActions inside the title bar', () => {
    render(
      <Terminal
        commands={noopCommands}
        headerRightActions={<span data-testid="extra-action">extra</span>}
      />,
    );
    expect(screen.getByTestId('extra-action')).toBeInTheDocument();
  });
});

describe('Terminal - accessibility', () => {
  it('gives the icon-only close and submit buttons accessible names', () => {
    render(<Terminal commands={{}} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Close terminal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run command' })).toBeInTheDocument();
  });

  it('focuses the input when clicking anywhere in the terminal body', async () => {
    const user = userEvent.setup();
    const { container } = render(<Terminal commands={{}} />);
    const root = container.firstElementChild as HTMLElement;
    await user.click(root);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

describe('Terminal - command handling', () => {
  it('echoes submitted commands into history with the prompt prefix and clears the field', async () => {
    render(<Terminal commands={{}} promptString="user@t:~$" />);
    const input = await typeAndRun('hello world');
    expect(await screen.findByText('user@t:~$ hello world')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('does nothing when submitting an empty command', async () => {
    render(<Terminal commands={{}} promptString="user@t:~$" />);
    await typeAndRun('');
    // 空送信では履歴が増えない（"プロンプト + コマンド" の行も出力されない）
    expect(screen.queryByText(/user@t:~\$ ./)).not.toBeInTheDocument();
  });

  it('reports unknown commands through commandNotFoundFormatter', async () => {
    const formatter = vi.fn((cmd: string) => `[ERR] "${cmd}" is unknown`);
    render(<Terminal commands={{}} commandNotFoundFormatter={formatter} />);
    await typeAndRun('frobnicate');
    expect(formatter).toHaveBeenCalledWith('frobnicate');
    expect(await screen.findByText('[ERR] "frobnicate" is unknown')).toBeInTheDocument();
  });

  it('clears history when the built-in clear command runs', async () => {
    render(
      <Terminal
        commands={{}}
        initialHistory={[{ type: 'output', text: 'old message' }]}
      />,
    );
    expect(screen.getByText('old message')).toBeInTheDocument();
    await typeAndRun('clear');
    await waitFor(() => {
      expect(screen.queryByText('old message')).not.toBeInTheDocument();
    });
  });

  it('streams logs yielded by an async generator command', async () => {
    const help: CommandAction = async function* () {
      yield { type: 'log', log: { type: 'output', text: 'line one' } };
      yield { type: 'log', log: { type: 'success', text: 'line two' } };
    };
    render(<Terminal commands={{ help }} />);
    await typeAndRun('help');
    expect(await screen.findByText('line one')).toBeInTheDocument();
    expect(await screen.findByText('line two')).toBeInTheDocument();
  });

  it('shows progress text and percentage while a command reports progress', async () => {
    let resume!: () => void;
    const gated = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const deploy: CommandAction = async function* () {
      yield { type: 'progress', percent: 42, text: 'Uploading...' };
      await gated;
      yield { type: 'log', log: { type: 'output', text: 'upload complete' } };
    };
    render(<Terminal commands={{ deploy }} />);
    await typeAndRun('deploy');

    expect(await screen.findByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();

    resume();
    expect(await screen.findByText('upload complete')).toBeInTheDocument();
    // 完了後はプログレスバーが消える
    await waitFor(() => {
      expect(screen.queryByText('42%')).not.toBeInTheDocument();
    });
  });
});

describe('Terminal - system locking', () => {
  it('disables input with systemLockedText while a command is executing', async () => {
    let resume!: () => void;
    const gated = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const slow: CommandAction = async function* () {
      await gated;
      yield { type: 'log', log: { type: 'output', text: 'finally done' } };
    };
    render(<Terminal commands={{ slow }} systemLockedText="LOCKED" />);
    const input = await typeAndRun('slow');

    expect(input).toBeDisabled();
    expect(screen.getByPlaceholderText('LOCKED')).toBeInTheDocument();

    resume();
    expect(await screen.findByText('finally done')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeEnabled();
    });
  });

  it('ignores submissions while locked', async () => {
    let resume!: () => void;
    const gated = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const slow: CommandAction = async function* () {
      await gated;
    };
    const user = userEvent.setup();
    render(<Terminal commands={{ slow }} />);

    await user.type(screen.getByRole('textbox'), 'slow{Enter}');
    const lockedInput = screen.getByRole('textbox');
    expect(lockedInput).toBeDisabled();

    // ロック中は入力不可のため新たなコマンドは送信できない
    await user.keyboard('{Enter}');
    resume();

    // ロック解除後、履歴には "slow" の実行が 1 回だけ記録されている
    expect(await screen.findByText(/slow$/)).toBeInTheDocument();
    expect(screen.getAllByText(/user@terminal:~\$ slow/)).toHaveLength(1);
  });
});

describe('Terminal - close button', () => {
  it('calls onClose when the close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Terminal commands={{}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close terminal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the close button when showCloseButton is false', () => {
    render(<Terminal commands={{}} onClose={() => {}} showCloseButton={false} />);
    expect(screen.queryByRole('button', { name: 'Close terminal' })).not.toBeInTheDocument();
  });

  it('hides the close button when onClose is not provided', () => {
    render(<Terminal commands={{}} />);
    expect(screen.queryByRole('button', { name: 'Close terminal' })).not.toBeInTheDocument();
  });
});

describe('Terminal - click behavior', () => {
  it('keeps focusing the input after rerender', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Terminal commands={{}} title="v1" />);
    rerender(<Terminal commands={{}} title="v2" />);
    await user.click(container.firstElementChild as HTMLElement);
    expect(screen.getByRole('textbox')).toHaveFocus();
    expect(screen.getByText('v2')).toBeInTheDocument();
  });

  it('stops click propagation from the close button so the terminal body does not refocus the input', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Terminal commands={{}} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'Close terminal' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });

  it('submits via the Run command button as well as Enter key', async () => {
    const user = userEvent.setup();
    render(<Terminal commands={{}} promptString="p:~$" />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'via-button');
    await user.click(screen.getByRole('button', { name: 'Run command' }));
    expect(await screen.findByText('p:~$ via-button')).toBeInTheDocument();
  });

  it('handles rapid consecutive submissions', async () => {
    const echo: CommandAction = async function* (args) {
      yield { type: 'log', log: { type: 'output', text: args.join(' ') } };
    };
    render(<Terminal commands={{ echo }} />);
    await typeAndRun('echo one');
    await typeAndRun('echo two');
    expect(await screen.findByText('echo one')).toBeInTheDocument();
    expect(screen.getByText('echo two')).toBeInTheDocument();
  });
});
