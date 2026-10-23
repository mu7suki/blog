// 記事一覧：全文検索・タグ絞り込み・並び替え・ページ分け
// カードはビルド時に全件出力済み。ここでは並べ替えと表示/非表示だけを行う

type IndexEntry = { id: string; title: string; text: string; tags: string };

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

const els = {
  q: $<HTMLInputElement>("#q"),
  sort: $<HTMLSelectElement>("#sort"),
  per: $<HTMLSelectElement>("#per-page"),
  tags: $<HTMLElement>("#tag-filter"),
  clear: $<HTMLButtonElement>("#tag-filter [data-clear]"),
  list: $<HTMLElement>("#article-list"),
  empty: $<HTMLElement>("#empty"),
  pager: $<HTMLElement>("#pagination"),
  count: $<HTMLElement>("#result-count"),
};

const index: IndexEntry[] = JSON.parse($("#search-index").textContent || "[]");
const byId = new Map(index.map((e) => [e.id, e]));

const cards = [...els.list.querySelectorAll<HTMLElement>(".card")].map((el) => {
  const entry = byId.get(el.dataset.id!)!;
  return {
    el,
    entry,
    date: el.dataset.date!,
    updated: el.dataset.updated!,
    tags: (el.dataset.tags || "").split(" ").filter(Boolean),
    titleEl: el.querySelector<HTMLElement>(".card-title a")!,
    excerptEl: el.querySelector<HTMLElement>(".card-excerpt")!,
    haystack: [entry.title, entry.text, entry.tags].join("\n").toLowerCase(),
  };
});
type Card = (typeof cards)[number];

// ---------- 状態（URL クエリと同期。タグリンクから来たときもここで反映） ----------

const params = new URLSearchParams(location.search);
let storedPer: string | null = null;
try { storedPer = localStorage.getItem("blog.perPage"); } catch {}

const state = {
  q: params.get("q") || "",
  tags: new Set(params.getAll("tag")),
  sort: params.get("sort") || "new",
  per: Number(params.get("per") ?? storedPer ?? 9),
  page: Math.max(1, Number(params.get("page")) || 1),
};

els.q.value = state.q;
els.sort.value = state.sort;
if (![...els.per.options].some((o) => Number(o.value) === state.per)) state.per = 9;
els.per.value = String(state.per);

// ---------- 表示用ヘルパー ----------

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function highlight(text: string, query: string): string {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return escapeHtml(text);
  return escapeHtml(text.slice(0, i)) + `<mark>${escapeHtml(text.slice(i, i + query.length))}</mark>` + escapeHtml(text.slice(i + query.length));
}

// 検索語の周辺を切り出してハイライト
function excerptHtml(text: string, query: string, len = 110): string {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return escapeHtml(text.length > len ? text.slice(0, len) + "…" : text);
  const start = Math.max(0, i - 30);
  const end = Math.min(text.length, start + len);
  return (start > 0 ? "…" : "") + highlight(text.slice(start, end), query) + (end < text.length ? "…" : "");
}

const sorters: Record<string, (a: Card, b: Card) => number> = {
  new: (a, b) => b.date.localeCompare(a.date),
  old: (a, b) => a.date.localeCompare(b.date),
  updated: (a, b) => b.updated.localeCompare(a.updated),
  title: (a, b) => a.entry.title.localeCompare(b.entry.title, "ja"),
};

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const sorted = [...new Set([1, total, current, current - 1, current + 1])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.q) p.set("q", state.q);
  state.tags.forEach((t) => p.append("tag", t));
  if (state.sort !== "new") p.set("sort", state.sort);
  if (state.page > 1) p.set("page", String(state.page));
  const qs = p.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));
}

// ---------- 描画 ----------

function render() {
  const terms = state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const firstTerm = state.q.trim().split(/\s+/)[0] || "";

  const rows = cards
    .filter((c) => (!state.tags.size || c.tags.some((t) => state.tags.has(t))) && terms.every((t) => c.haystack.includes(t)))
    .sort(sorters[state.sort] || sorters.new);

  const per = state.per || rows.length || 1;
  const totalPages = Math.max(1, Math.ceil(rows.length / per));
  state.page = Math.min(state.page, totalPages);
  const visible = new Set(rows.slice((state.page - 1) * per, state.page * per));

  // 並び順どおりに DOM を入れ替え、ページ外は隠す
  rows.forEach((c) => els.list.appendChild(c.el));
  cards.forEach((c) => {
    c.el.hidden = !visible.has(c);
    c.titleEl.innerHTML = highlight(c.entry.title, firstTerm);
    c.excerptEl.innerHTML = excerptHtml(c.entry.text, firstTerm);
  });

  els.empty.hidden = rows.length > 0;
  els.count.textContent = `(${rows.length})`;

  els.pager.innerHTML =
    totalPages <= 1
      ? ""
      : `<button type="button" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="previous">←</button>` +
        pageList(state.page, totalPages)
          .map((n) => (n === "…" ? `<span class="gap">…</span>` : `<button type="button" data-page="${n}" ${n === state.page ? 'aria-current="page"' : ""}>${n}</button>`))
          .join("") +
        `<button type="button" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""} aria-label="next">→</button>`;

  els.tags.querySelectorAll<HTMLButtonElement>("[data-tag]").forEach((b) => b.setAttribute("aria-pressed", String(state.tags.has(b.dataset.tag!))));
  els.clear.hidden = state.tags.size === 0;

  syncUrl();
}

// ---------- イベント ----------

let timer: number | undefined;
els.q.addEventListener("input", () => {
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    state.q = els.q.value;
    state.page = 1;
    render();
  }, 120);
});

els.sort.addEventListener("change", () => {
  state.sort = els.sort.value;
  state.page = 1;
  render();
});

els.per.addEventListener("change", () => {
  state.per = Number(els.per.value);
  state.page = 1;
  try { localStorage.setItem("blog.perPage", String(state.per)); } catch {}
  render();
});

els.tags.addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button");
  if (!btn) return;
  if (btn.hasAttribute("data-clear")) state.tags.clear();
  else {
    const t = btn.dataset.tag!;
    state.tags.has(t) ? state.tags.delete(t) : state.tags.add(t);
  }
  state.page = 1;
  render();
});

els.pager.addEventListener("click", (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-page]");
  if (!btn || btn.disabled) return;
  state.page = Number(btn.dataset.page);
  render();
  els.list.closest(".section")!.scrollIntoView({ behavior: "smooth", block: "start" });
});

render();
