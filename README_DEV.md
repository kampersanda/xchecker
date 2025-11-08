# README_DEV（開発者向けガイド）

## プロジェクト概要
- 与えられたトライ木からダブル配列を構築するパズルゲームを、TypeScript + PIXI.js で実装しています。
- ビルド成果物（`app/main.js` と静的アセット）は GitHub Pages（`app/` 配下）でそのまま配信されるため、開発時も同じ構成を保つ必要があります。
- エントリーポイントは `src/main.ts`、シーン管理は `src/scenes/` 以下、入力は `src/input/`、補助ロジックは `src/utils/` / `src/trie.ts` にまとまっています。

## 必要なツール
- Node.js 16 以上（LTS 推奨）
- npm 8 以上
- 任意: 任意の静的サーバ（例: `npx http-server` や `python -m http.server`）

## セットアップ
```bash
npm install
```
- インストール後、`node_modules/.bin` に入った `webpack` / `ts-loader` を利用して TypeScript をバンドルします。

## 開発ワークフロー

### 1. **ビルド監視**

```bash
npx webpack --config webpack.config.js --watch
```
- `webpack.config.js` は `src/main.ts` をエントリーポイントとし、出力を `app/main.js` に書き出します。
- `--watch` を付けると差分ビルドが動作するため、エディタ保存 → 自動バンドル → ブラウザリロードの流れが簡素化されます。

### 2. **ローカル実行**

- 静的サーバを `app/` 直下で起動し、`http://localhost:<PORT>/app/index.html` を開きます。
   ```bash
   npx http-server . -c-1
   # もしくは
   npx serve app
   ```
- `app/index.html` は CDN から PIXI/WebFont のランタイムを読み込み、生成済みの `main.js` を実行します。

### 3. **フォント**

- ゲーム内で使う `MPLUSRounded1c` は `font/` 以下に `.ttf` を置き、`app/font.css` 経由で `WebFont.load()` から読み込まれます。
- 別フォントに差し替える場合は `font/` の実体と `app/font.css`、および `src/constants.ts` の `FONT_FAMILY` を併せて更新してください。

## ディレクトリの目安
| パス | 役割 |
| --- | --- |
| `src/main.ts` | PIXI アプリのセットアップ、シーンマネージャ、WebFont 読み込み、リサイズ処理を束ねるエントリー。 |
| `src/scenes/` | `SceneController`（`types.ts`）インターフェースに沿ったシーン実装。`SelectScene` → `PlayScene` の遷移を行います。 |
| `src/input/keyboard.ts` | 方向キー/Enter などのキーバインドを定義し、シーンから参照できるようにしています。 |
| `src/utils/resizeCanvas.ts` | ブラウザサイズに応じたキャンバスのスケーリング。 |
| `src/trie.ts` | ダブル配列構築ロジック（解候補生成、トライ構築）。ゲームルールの中核です。 |
| `app/` | ビルド成果物と静的リソース。GitHub Pages の `app/` ディレクトリとして公開されます。 |
| `font/` | バンドル対象ではないローカルフォント。`app/font.css` から参照されます。 |

## 実装時の指針

- **シーン追加**: 新しいゲーム状態を作る場合は `SceneController` を実装したクラスを `src/scenes/` に追加し、`SceneUpdate` にイベントを定義して `main.ts` の `handleSceneUpdate` で分岐を追加してください。
- **入力拡張**: `src/input/keyboard.ts` の `GameKeys` に新しいキーを追加し、`createKey` で購読。シーンで `press` / `release` をアタッチするのが基本フローです。
- **描画**: PIXI の `Container`, `Graphics`, `Text` を直接利用しています。大規模な UI を追加する場合はコンポーネント用のユーティリティを `src/utils/` に増やしてください。
- **型定義**: `tsconfig.json` は `strict: true` のため、null 安全・戻り値型などを漏れなく記述してください。`esModuleInterop` を有効にしているので `import * as PIXI from "pixi.js"` といった書き方が想定されています。

## デプロイ/リリースのヒント

- GitHub Pages への公開は `main` ブランチの `app/` ディレクトリをそのまま利用しています。新しいビルド内容を公開したい場合は `webpack` 実行後に生成された `app/main.js` をコミットしてください。
- `app/` 以外のファイルはビルドのみで公開されないため、CI を導入する場合は Pages 用アーティファクトに `app/` を含めるようにします。

## 未整備の領域

- 自動テストは未実装です（`npm test` はプレースホルダー）。ロジックが増える場合は `jest` や `vitest` の導入を検討してください。
- Lint/Formatter も入れていないため、PR ベースでルールを合意してから `eslint` / `prettier` を追加すると保守性が向上します。
