import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import remarkBreaks from "remark-breaks";

// GitHub Actions（.github/workflows/deploy.yml）から公開先の URL とパスが渡される。
// ローカル（npm run dev）では未設定なので "/" で動く。
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || "/",
  trailingSlash: "ignore",
  markdown: {
    // 本文中の改行をそのまま <br> にする（日記帳と同じ書き味）
    processor: unified({ remarkPlugins: [remarkBreaks] }),
  },
});
