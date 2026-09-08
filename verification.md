# verification-skill の使い方

このドキュメントは、プロジェクトローカルの検証スキル
`verify-hakoniwa-term`（`.opencode/skills/verify-hakoniwa-term/`）の使い方をまとめたものです。
`Terminal` の動作について「動く」と主張する前に、このスキルで実証するのがルールです。

## Overview（このスキルは何か）

- 対象: `hakoniwa-term`（`src/Terminal.tsx` の React コンポーネント・ライブラリ）。サーバーではないため、デプロイや起動の代わりに「ビルドして、テストハーネスで実際に操作する」ことで検証します。
- ハーネス: 既存の vitest + `@testing-library/react` + `user-event` + jsdom（`vitest.config.ts`、`src/test/setup.ts`）。目視確認が必要な場合のみ `example/hakoniwa-sample-3` の Vite プレイグラウンドを使います。
- 成果物: 検証の証拠（transcript、結果 JSON、ビルドログ）は `artifacts/<run-id>/` に残り、クリーンアップでも削除されません。

## Where Things Live（ファイル構成）

```text
.opencode/skills/verify-hakoniwa-term/
├── SKILL.md            # スキル本体（Launch / Doctor / Drive / Evidence / Cleanup / Helpers）
├── scripts/
│   ├── doctor.mjs      # 読み取り専用の事前診断
│   └── run-verify.mjs  # テスト実行＋証拠保存＋後片付けのラッパー
├── features/
│   ├── README.md       # 検証マップの索引・約束事
│   ├── run-command.md
│   ├── stream-progress.md
│   ├── theme-preset.md
│   └── window-chrome.md
└── artifacts/
    └── proof-01/       # 実行済み検証の証拠（vitest-transcript.txt、result.json、build.log）
```

## How It Works（使い方フロー）

検証は必ず次の順序で進めます。各コマンドはリポジトリルートで実行します。

### 1. Launch（準備：ビルドして運転可能にする）

```powershell
pnpm install
pnpm build
# 完了条件: dist/index.js、dist/index.cjs、dist/index.d.ts、dist/index.css が存在する
```

通常の検証はヘッドレス（サーバー不要）です。目視確認が feature ファイルで明示された場合のみ、隔離ポートでプレイグラウンドを起動します。

```powershell
cd example/hakoniwa-sample-3
pnpm install
pnpm dev --port 5199 --strictPort
# 完了条件: vite が "Local:   http://localhost:5199/" と表示する
```

> 注意: `--port 5199 --strictPort` なしの `pnpm dev` は禁止です。デフォルトポート（5173）はユーザーの作業セッションと衝突する恐れがあります。

### 2. Doctor（診断：運転する価値があるか確認）

調子が悪いときは最初に実行します。読み取り専用で、何も変更しません。

```powershell
node .opencode/skills/verify-hakoniwa-term/scripts/doctor.mjs [--port 5199]
```

チェック内容：リポジトリルートであること、`node_modules` と vitest の存在、`dist/` のビルド成果物、`TERMINAL_PRESETS` の参照可能性、ハーネス設定ファイルの存在、検証ポートの空き（または自プロセスの所有）。終了コード `0` が READY の意味です。失敗時は具体的な修正方法（多くは `pnpm install` か `pnpm build`）を表示して非ゼロ終了します。赤信号のまま Drive に進んではいけません。

### 3. Drive（運転：フィーチャーを実際に操作する）

まず `features/README.md` を読み、対象の feature ファイルをレシピにします。各 feature ファイルは「前提条件（Preconditions）」＋「操作とコマンド・観測結果のペア」で書かれています。

```powershell
# 全件実行（ヘッドレス、推奨）
pnpm vitest run src/Terminal.test.tsx

# 1機能だけ実行（feature ファイル記載の -t フィルタをそのまま使う）
pnpm vitest run src/Terminal.test.tsx -t "shows progress text and percentage" --reporter=verbose

# 証拠保存つきラッパー（transcript と result.json を artifacts に書き出す）
node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --test-name "shows progress text and percentage" --out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>
```

安定ハンドルの優先順位：`getByRole("textbox")`（コマンド入力）→ `getByRole("button", { name: "Run command" })` → `getByRole("button", { name: "Close terminal" })` → プロンプト付き履歴テキスト → placeholder → ルート要素の `--terminal-*` CSS 変数。座標・タブ順・CSS Modules のクラス名（ハッシュ化される）は使いません。

### 4. Evidence（証拠：操作と結果の両方を残す）

`artifacts/<run-id>/` に保存します。

- `vitest-transcript.txt` — 実行コマンド・終了コード・標準出力全体
- `result.json` — `{ testName, exitCode, passed, timestamp }`
- `build.log` — 運転対象の `dist/` を証明する `pnpm build` 出力
- 目視検証時のみ追加：DOM 抜粋＋プレイグラウンド名（`Terminal Preset Playground` 見出しと `terminal -- preset: <名>` タイトル）が写ったスクリーンショット

証明の基準：内部 setter やテスト専用エンドポイントではなく、実際のユーザー経路（入力→Enter/`Run command` ボタン）で操作すること。最終画面だけでなく「操作と結果の状態」を両方残すこと（例：実行中は `42%` が見え、完了後は消えている）。feature ID と入口（entry point）を証拠ごとに記録すること。

### 5. Cleanup（後片付け：証拠は残し、起動物だけ消す）

```powershell
node .opencode/skills/verify-hakoniwa-term/scripts/run-verify.mjs --cleanup [--out .opencode/skills/verify-hakoniwa-term/artifacts/<run-id>]
```

- 自分が起動したデモの PID（`.verify-demo-pid` に記録）のみ停止します。プロセス名での kill は禁止です。
- `artifacts/<run-id>/` は削除しません。終了後に transcript と `result.json` が残っていることを確認します（証拠を消すクリーンアップは失敗扱い）。
- 失敗した試行の後も必ず実行し、ポートやプロセスを残さないようにします。

## Key Concepts（feature マップの読み方）

- `features/README.md` が索引です。検証前に必ず読み、対応する feature ファイルをレシピにします。
- 各 feature ファイルは H1 タイトル＋概要段落の後、4つの H2（`Sub-features` → `How to get to it (user POV)` → `Driving it with <harness>` → `Gotchas`）で構成されます。
- 対応表：`run-command`（入力・送信・echo・unknown・clear）、`stream-progress`（非同期ストリーミング・プログレスバー・ system lock）、`theme-preset`（6プリセット・部分上書き）、`window-chrome`（タイトル・閉じるボタン・フォーカス）。
- ある入口が到達不能な場合は、試したコマンドと未充足の前提条件を記録します。別経路での検証済みとして報告してはいけません。

## Gotchas

- コマンド名の照合は先頭トークンの小文字化で行われます。`clear` は `commands` を迂回し、常に履歴を空にします。
- 空送信（`trim()` 後が空）は履歴を追加しません。
- 未知プリセット名は `emerald` にフォールバックします（クラッシュしません）。
- `Close terminal` ボタンは `onClose` と `showCloseButton !== false` の両方が必要です。
- 本体クリックのフォーカス移動はボタンを除外します（Run/Close のクリックでは入力にフォーカスしません）。
- ロック中は placeholder が `systemLockedText` に切り替わります。実行中に idle 側の placeholder を検証すると誤って失敗します。

## メンテナンス

アプリの変更に合わせてマップを正直に保つには `/maintain-verification-skill` を使います。
