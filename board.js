const TAGS = ["经济","政治","生活","民生","见识","工作","安全","时机","地域"];
const WEEK = "日一二三四五六";
const state = { data: [], date: null, tag: "", q: "", i: 0, view: "prep" };

const $ = (id) => document.getElementById(id);

function fmt(date) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return y + "年" + m + "月" + d + "日 周" + WEEK[dt.getDay()];
}
function all() {
  return [...state.data].sort((a, b) => b.date.localeCompare(a.date));
}
function current() {
  return all().find((b) => b.date === state.date) || all()[0];
}
function itemsOf(b) {
  const q = state.q.trim().toLowerCase();
  return (b.items || []).filter((it) => {
    if (state.tag && !(it.tags || []).includes(state.tag)) return false;
    if (!q) return true;
    const blob = [it.title, it.why, it.body, (it.tags || []).join(" "),
      ...(it.sources || []).map((s) => (s.name || "") + " " + (s.url || ""))]
      .join(" ").toLowerCase();
    return blob.includes(q);
  });
}
function esc(s) {
  return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
function showCard() {
  $("card").scrollIntoView({ block: "start", behavior: "smooth" });
}

function render() {
  const b = current();
  if (!b) {
    $("card").innerHTML = '<p class="empty">还没有简报。</p>';
    return;
  }
  state.date = b.date;
  const items = itemsOf(b);
  const prep = b.prepare || [];
  if (state.view !== "prep" && (state.i < 0 || state.i >= items.length)) {
    state.i = 0;
    if (!items.length) state.view = prep.length ? "prep" : "prep";
  }

  $("kicker").textContent = all()[0] && all()[0].date === b.date ? "今天" : "存档";
  $("dateTitle").textContent = fmt(b.date);

  $("filters").innerHTML = TAGS.map((t) =>
    '<button type="button" data-tag="' + t + '" class="' + (state.tag === t ? "on" : "") + '">' + t + "</button>"
  ).join("");

  $("dates").innerHTML = all().map((x) =>
    '<button type="button" data-date="' + x.date + '" class="' + (x.date === b.date ? "on" : "") + '">' + x.date.slice(5) + "</button>"
  ).join("");

  let toc = "";
  if (prep.length) {
    toc += '<button type="button" data-view="prep" class="' + (state.view === "prep" ? "on" : "") + '"><span class="n">备</span>今日可准备（' + prep.length + "）</button>";
  }
  let lastSec = "";
  items.forEach((it, idx) => {
    if (it.section && it.section !== lastSec) {
      toc += '<div class="sec">' + esc(it.section) + "</div>";
      lastSec = it.section;
    }
    const on = state.view === "item" && state.i === idx ? "on" : "";
    toc += '<button type="button" data-view="item" data-i="' + idx + '" class="' + on + '"><span class="n">' + (idx + 1) + "</span>" + esc(it.title) + "</button>";
  });
  if (!toc) toc = '<p class="empty">没有对得上的条目。</p>';
  $("toc").innerHTML = toc;

  const atPrep = state.view === "prep";
  const atItem = state.view === "item" && items[state.i];
  $("prev").disabled = atPrep || (atItem && state.i <= 0 && !prep.length);
  if (atPrep) $("prev").disabled = true;
  $("next").disabled = items.length === 0 || (atItem && state.i >= items.length - 1);
  if (atPrep) $("next").disabled = items.length === 0;
  $("pos").textContent = atPrep ? "可准备" : (atItem ? (state.i + 1) + " / " + items.length : "");

  if (atPrep) {
    $("card").innerHTML = '<div class="prep-box"><h3>今日可准备</h3><ol>' +
      prep.map((p) => "<li>" + esc(p) + "</li>").join("") + "</ol></div>";
    return;
  }
  if (!atItem) {
    $("card").innerHTML = '<p class="empty">没有对得上的条目。</p>';
    return;
  }
  const it = items[state.i];
  const tags = (it.tags || []).map((t) => '<span class="tag">' + esc(t) + "</span>").join("");
  const src = (it.sources || []).map((s) =>
    '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + esc(s.name || s.url) + "</a>"
  ).join(" · ");
  $("card").innerHTML =
    '<div class="item"><div class="tags">' + tags + "</div><h3>" + esc(it.title) + "</h3>" +
    '<p class="why">' + esc(it.why || "") + "</p>" +
    '<p class="body">' + esc(it.body || "") + "</p>" +
    '<p class="src">' + src + "</p></div>";
}

function goPrep() { state.view = "prep"; render(); showCard(); }
function goItem(i) { state.view = "item"; state.i = i; render(); showCard(); }

function bind() {
  $("filters").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    state.tag = state.tag === t.dataset.tag ? "" : t.dataset.tag;
    state.i = 0; state.view = "prep"; render();
  });
  $("dates").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    state.date = t.dataset.date; state.i = 0; state.view = "prep"; render();
  });
  $("toc").addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.dataset.view === "prep") goPrep();
    else goItem(Number(t.dataset.i));
  });
  $("q").addEventListener("input", (e) => {
    state.q = e.target.value; state.i = 0; state.view = "prep"; render();
  });
  $("prev").addEventListener("click", () => {
    if (state.view === "item" && state.i > 0) goItem(state.i - 1);
    else goPrep();
  });
  $("next").addEventListener("click", () => {
    const items = itemsOf(current() || { items: [] });
    if (state.view === "prep" && items.length) goItem(0);
    else if (state.view === "item" && state.i < items.length - 1) goItem(state.i + 1);
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") $("prev").click();
    if (e.key === "ArrowRight") $("next").click();
  });
}

function boot(data) {
  state.data = (data && data.briefs) || [];
  state.date = (all()[0] || {}).date;
  bind();
  render();
}
if (typeof BOOT !== "undefined") boot(BOOT);
else fetch("./data/briefs.json").then((r) => r.json()).then(boot);
