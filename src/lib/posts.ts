import { getCollection, type CollectionEntry } from "astro:content";
import tagDefs from "../data/tags.json";

export type Post = CollectionEntry<"posts">;

type TagDef = { label: string; color: string };
const TAGS = tagDefs as Record<string, TagDef>;

export function tagInfo(tag: string): TagDef {
  return TAGS[tag] ?? { label: tag, color: "#9aa0aa" };
}

export const tagOrder = Object.keys(TAGS);

// 下書き（draft: true）を除いて新しい順
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

// "2026-10-22T17:40" -> "2026.10.22 17:40"
export function formatDate(value: string, withTime = true): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return value;
  const date = `${m[1]}.${m[2]}.${m[3]}`;
  return withTime && m[4] ? `${date} ${m[4]}:${m[5]}` : date;
}

// Markdown 記法を取り除いたプレーンテキスト（抜粋・文字数・検索用）
export function plainText(md = ""): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export const letterCount = (md = "") => plainText(md).replace(/\s/g, "").length;

// base（GitHub Pages のリポジトリ名）を考慮したリンク
export function url(path = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return base + path.replace(/^\//, "");
}

export const postUrl = (id: string) => url(`${id}/`);
export const tagUrl = (tag: string) => url(`articles/?tag=${encodeURIComponent(tag)}`);
