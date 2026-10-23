# Blog.

Astro 製のブログ。`main` ブランチに push すると GitHub Actions がビルドして GitHub Pages に公開する。

## 記事の書き方

`src/content/posts/` に `4桁の番号.md` を置く。ファイル名がそのまま URL（`/0012/`）になる。

```md
---
title: "記事タイトル"
date: "2026-10-23T21:00"
updated: "2026-10-23T21:30"   # 省略可
tags: [diary, photo]
draft: false                  # true にすると公開されない（省略可）
---

本文（Markdown）。改行はそのまま改行として表示される。
```

タグの表示名と色は `src/data/tags.json` で定義する。未定義のタグはグレーで表示される。

## GitHub Pages の初回設定

1. このフォルダを GitHub のリポジトリ（ブランチ名 `main`）にアップロードする
   - `node_modules/` `dist/` `.astro/` はアップロードしない（`.gitignore` 済み）
   - `.github/` フォルダは必ず含める
2. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
3. **Actions** タブで「Deploy to GitHub Pages」が成功すれば `https://<ユーザー名>.github.io/<リポジトリ名>/` で公開される

公開先の URL とパスは Actions が自動で設定するので、リポジトリ名を変えても設定ファイルの修正は不要。

## ローカルで確認する

Node.js 22.23.4 以上が必要。

```bash
npm install
npm run dev
```

http://localhost:4321/home/ で確認できる。
