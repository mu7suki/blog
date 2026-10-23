import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// 日時は "2026-10-22T17:40" 形式の文字列で持つ（ビルド環境のタイムゾーンに左右されないように）
const dateTime = z
  .union([z.string(), z.date()])
  .transform((v) => (typeof v === "string" ? v : v.toISOString().slice(0, 16)));

// 記事は src/content/posts/0000.md のように「4桁の番号.md」で置く。ファイル名がそのまま URL になる
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    date: dateTime,
    updated: dateTime.optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
