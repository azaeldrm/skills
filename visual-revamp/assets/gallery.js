// Gallery shell: the review page as a deck of screens that each fit the window, never scrolling vertically.
// No dependencies. Include gallery.css and this file (or inline both; nothing in them closes a tag).
//
//   <body class="g">
//     <header class="g-bar"><div class="g-col"> brand · <nav class="g-nav"></nav> · your toggles </div></header>
//     <main class="g-pages">
//       <section class="g-page" data-section="Overview" data-name="Direction"> ... </section>
//       <section class="g-page" data-section="UX" data-name="Write a note"> <div class="uxf">...</div> </section>
//       <section class="g-page" data-section="Design system" data-name="Color" data-split>
//         <h2>Color</h2> <div class="g-block">...</div> <div class="g-block">...</div>
//       </section>
//     </main>
//     <footer class="g-bar g-pager"><div class="g-col"></div></footer>
//   </body>
//
// - One page shows at a time. Move with the pager's buttons and dots, the section links it builds in
//   .g-nav, the arrow / PageUp / PageDown / Home / End keys, or a sideways swipe.
// - A data-split page spreads its .g-block children over as many pages as the window needs (its first
//   heading repeats with "1 / 2"); redone on resize. A block taller than a page on its own is shrunk to fit.
// - data-short on a section's first page gives its header link a short label for narrow screens
//   (data-section="Design system" data-short="System").
// - Pages are re-split on resize and whenever a web font finishes loading, keeping the current page.
// - The URL hash holds the current page, so a reload or a shared link opens on it.
// - Header, page and pager content share one centred column (--g-max, default 1200px).
// - Flows on hidden pages are paused; a flow starts from step 1 when its page is shown (ux-flow.js).
(() => {
  const main = document.querySelector(".g-pages");
  if (!main) return;
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const sources = [...main.querySelectorAll(":scope > .g-page")];
  sources.forEach((p) => { if (p.hasAttribute("data-split")) p.remove(); });
  const splits = sources.filter((p) => p.hasAttribute("data-split")).map((p) => ({ src: p, made: [] }));
  let pages = [], cur = 0;

  const order = () => sources.flatMap((p) => (p.hasAttribute("data-split") ? splits.find((s) => s.src === p).made : [p]));

  // Fill pages one block at a time; start a new page when the next block would overflow.
  const split = () => {
    splits.forEach((s) => {
      s.made.forEach((m) => m.remove());
      s.made = [];
      const heading = s.src.querySelector(":scope > h2");
      const blocks = [...s.src.querySelectorAll(":scope > .g-block")];
      const anchor = sources[sources.indexOf(s.src) + 1];
      const fresh = () => {
        const pg = s.src.cloneNode(false);
        pg.removeAttribute("data-split");
        pg.removeAttribute("id");
        pg.classList.add("on", "g-measure");
        if (heading) pg.appendChild(heading.cloneNode(true));
        const body = document.createElement("div");
        body.className = "g-flow";
        pg.appendChild(body);
        let next = anchor;
        while (next && next.hasAttribute("data-split") && !next.isConnected) next = sources[sources.indexOf(next) + 1];
        main.insertBefore(pg, next && next.isConnected ? next : null);
        s.made.push(pg);
        return body;
      };
      let body = fresh();
      blocks.forEach((b) => {
        const c = b.cloneNode(true);
        body.appendChild(c);
        const pg = body.parentElement;
        if (pg.scrollHeight > pg.clientHeight + 1 && body.children.length > 1) {
          c.remove();
          body = fresh();
          body.appendChild(c);
        }
        // Too tall on its own: shrink it. The block reflows once zoomed, so re-measure a few times.
        const pg2 = body.parentElement;
        for (let k = 0; k < 4 && pg2.scrollHeight > pg2.clientHeight + 1; k++) {
          const over = pg2.scrollHeight - pg2.clientHeight;
          const h = c.getBoundingClientRect().height;
          const z = parseFloat(c.style.zoom) || 1;
          c.style.zoom = Math.max(0.3, z * (h - over - 2) / h);
        }
      });
      const n = s.made.length;
      s.made.forEach((pg, i) => {
        pg.classList.remove("on", "g-measure");
        pg.dataset.name = (s.src.dataset.name || "") + (n > 1 ? ` ${i + 1}/${n}` : "");
        const h = pg.querySelector(":scope > h2");
        if (h && n > 1) { const k = document.createElement("span"); k.className = "g-count"; k.textContent = `${i + 1} / ${n}`; h.appendChild(k); }
      });
    });
    pages = order();
    pages.forEach((p, i) => {
      if (p.id && !p.hasAttribute("data-auto-id")) return;
      p.setAttribute("data-auto-id", "");
      p.id = slug(p.dataset.section + "-" + (p.dataset.name || i));
    });
  };

  const pager = document.querySelector(".g-pager .g-col");
  const nav = document.querySelector(".g-nav");

  const render = () => {
    if (nav) {
      nav.innerHTML = "";
      [...new Set(pages.map((p) => p.dataset.section))].forEach((sec) => {
        const b = document.createElement("button");
        b.type = "button";
        const short = pages.find((p) => p.dataset.section === sec && p.dataset.short)?.dataset.short;
        const long = document.createElement("span"); long.className = "g-long"; long.textContent = sec;
        b.appendChild(long);
        if (short) { const sh = document.createElement("span"); sh.className = "g-short"; sh.textContent = short; b.appendChild(sh); b.title = sec; }
        b.classList.toggle("on", pages[cur]?.dataset.section === sec);
        b.addEventListener("click", () => go(pages.findIndex((p) => p.dataset.section === sec)));
        nav.appendChild(b);
      });
    }
    if (pager) {
      pager.innerHTML = "";
      const prev = document.createElement("button"); prev.type = "button"; prev.className = "g-prev"; prev.textContent = "←";
      const next = document.createElement("button"); next.type = "button"; next.className = "g-next"; next.textContent = "→";
      prev.disabled = cur === 0; next.disabled = cur === pages.length - 1;
      prev.addEventListener("click", () => go(cur - 1)); next.addEventListener("click", () => go(cur + 1));
      const mid = document.createElement("div"); mid.className = "g-mid";
      const label = document.createElement("div"); label.className = "g-where";
      label.textContent = `${pages[cur].dataset.section} · ${pages[cur].dataset.name || ""}  ·  ${cur + 1} / ${pages.length}`;
      const dots = document.createElement("div"); dots.className = "g-dots";
      pages.forEach((p, i) => {
        if (i && p.dataset.section !== pages[i - 1].dataset.section) dots.appendChild(Object.assign(document.createElement("span"), { className: "g-sep" }));
        const d = document.createElement("button"); d.type = "button"; d.className = "g-dot" + (i === cur ? " on" : "");
        d.title = `${p.dataset.section} · ${p.dataset.name || ""}`;
        d.addEventListener("click", () => go(i));
        dots.appendChild(d);
      });
      mid.append(label, dots);
      pager.append(prev, mid, next);
    }
  };

  const go = (i) => {
    cur = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach((p, k) => p.classList.toggle("on", k === cur));
    history.replaceState(null, "", "#" + pages[cur].id);
    render();
  };

  const layout = () => {
    const keep = pages[cur]?.id;
    pages.forEach((p) => p.classList.remove("on"));
    split();
    let i = pages.findIndex((p) => p.id === keep);
    if (i < 0) i = pages.findIndex((p) => p.id === location.hash.slice(1));
    go(i < 0 ? 0 : i);
  };

  addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    const k = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (k) { e.preventDefault(); go(cur + k); }
    if (e.key === "Home") go(0);
    if (e.key === "End") go(pages.length - 1);
  });
  let x0 = null, y0 = null;
  main.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  main.addEventListener("touchend", (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  let t;
  addEventListener("resize", () => { clearTimeout(t); t = setTimeout(layout, 150); });
  addEventListener("hashchange", () => { const i = pages.findIndex((p) => p.id === location.hash.slice(1)); if (i >= 0 && i !== cur) go(i); });

  const start = () => layout();
  document.fonts && document.fonts.ready ? document.fonts.ready.then(start) : start();
  // fonts.ready can resolve before fonts used only on later pages arrive; re-split when any finish loading.
  if (document.fonts) document.fonts.addEventListener("loadingdone", () => { clearTimeout(t); t = setTimeout(layout, 50); });
  window.Gallery = { go, layout, get pages() { return pages; }, get current() { return cur; } };
})();
