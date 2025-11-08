# XChecker

ゲームリンク：[https://kampersanda.github.io/xchecker/app/](https://kampersanda.github.io/xchecker/app/)

![Playing.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/170428/b34a3d3e-26f7-9131-2f08-2500fb20b63d.gif)

与えられたトライ木からダブル配列を構築するゲームです。Typescript+PIXI.jsで書いています。

空き要素なくノードを配置できればクリアです。キーボードの方向キーで操作します。詳しくは[Qiita](https://qiita.com/kampersanda/items/09fff98f6e222fbdfde8)に書いています。

## セットアップ

```bash
npm install
```

インストール後、`node_modules/.bin` に入った `webpack` / `ts-loader` を利用して TypeScript をバンドルします。

## 開発ワークフロー

### 1. **ビルド監視**

```bash
npx webpack --config webpack.config.js --watch
```

`webpack.config.js` は `src/main.ts` をエントリーポイントとし、出力を `app/main.js` に書き出します。
`--watch` を付けると差分ビルドが動作するため、エディタ保存 → 自動バンドル → ブラウザリロードの流れが簡素化されます。

### 2. **ローカル実行**

静的サーバを `app/` 直下で起動し、`http://localhost:<PORT>/app/index.html` を開きます。

```bash
npx http-server . -c-1
# もしくは
npx serve app
```

`app/index.html` は CDN から PIXI/WebFont のランタイムを読み込み、生成済みの `main.js` を実行します。

### 3. **フォント**

ゲーム内で使う `MPLUSRounded1c` は `font/` 以下に `.ttf` を置き、`app/font.css` 経由で `WebFont.load()` から読み込まれます。
別フォントに差し替える場合は `font/` の実体と `app/font.css`、および `src/constants.ts` の `FONT_FAMILY` を併せて更新してください。
