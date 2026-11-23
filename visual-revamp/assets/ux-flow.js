// UX flow player: plays a scripted flow inside a device frame, with its steps listed beside it.
// No dependencies. Include ux-flow.css and this file, then mark up each flow (see example.html):
//
//   <div class="uxf" data-title="Sign in" data-frame="phone">
//     <div class="uxf-view" data-v="start">…</div>
//     <div class="uxf-view" data-v="done">…</div>
//     <script type="application/json">[[0,"view","start"], [400,"cap","Tap Continue"], …]</script>
//   </div>
//
// Or from script: UXFlow.mount(el, { title, frame, len, steps }).
//
// A step is [ms, op, ...args], run in time order. Ops:
//   cap  text              start a new caption in the step list (later steps belong to it)
//   view name              show the view with data-v=name (the previous one slides out)
//   move selector [ms]     move the pointer to the element's centre (optional duration)
//   tap                    pointer press ripple
//   hold true|false        pointer pressed down / released
//   hide                   lift the pointer away (fades out until the next move)
//   cls selector class on  add (on=true) or remove a class; the selector may match the screen itself
//   text selector value    set textContent
//   type selector value [msPerChar]   type the value one character at a time (default 45 ms)
//   html selector value    set innerHTML
//   attr selector name value          set an attribute
//   scroll selector px     scroll that element's content to px from the top
//
// The flow loops. Clicking a step jumps to it. Motion is off (instant cuts, no pointer travel) when
// an ancestor has data-motion="off" or the OS asks for reduced motion. Flows off screen pause.
// After changing theme or motion, call UXFlow.refresh() so every flow replays to its current time.
(() => {
  const flows = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  const expand = (steps) => {
    const out = [];
    for (const s of steps) {
      if (s[1] !== "type") { out.push(s); continue; }
      const [t, , sel, value, per = 45] = s;
      for (let k = 1; k <= value.length; k++) out.push([t + (k - 1) * per, "text", sel, value.slice(0, k)]);
    }
    return out.sort((a, b) => a[0] - b[0]);
  };

  class Flow {
    constructor(el, def) {
      this.el = el;
      this.steps = expand(def.steps || []);
      this.len = def.len || (this.steps.length ? this.steps[this.steps.length - 1][0] + 1800 : 3000);
      this.caps = this.steps.filter((s) => s[1] === "cap");
      this.build(def);
      this.t = 0; this.i = 0; this.playing = true; this.visible = true;
      new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(this.frame);
      this.seek(0);
    }

    build(def) {
      const el = this.el;
      const views = [...el.children].filter((c) => !c.matches("script"));
      el.innerHTML = "";
      el.classList.add("uxf");
      this.frame = document.createElement("div");
      this.frame.className = "uxf-frame uxf-" + (def.frame || el.dataset.frame || "phone");
      this.screen = document.createElement("div");
      this.screen.className = "uxf-screen";
      views.forEach((v) => this.screen.appendChild(v));
      this.pointer = document.createElement("div");
      this.pointer.className = "uxf-pointer";
      this.screen.appendChild(this.pointer);
      this.frame.appendChild(this.screen);
      this.initial = this.screen.innerHTML;

      const side = document.createElement("div");
      side.className = "uxf-side";
      const title = def.title || el.dataset.title || "";
      side.innerHTML =
        (title ? `<h3 class="uxf-title"></h3>` : "") +
        `<div class="uxf-ctl"><button type="button" data-play>Pause</button><button type="button" data-restart>Restart</button>` +
        `<div class="uxf-progress"><i></i></div></div><ol class="uxf-steps"></ol>` +
        `<div class="uxf-meta">${Math.round(this.len / 1000)} s loop · click a step to jump to it</div>`;
      if (title) side.querySelector(".uxf-title").textContent = title;
      const ol = side.querySelector(".uxf-steps");
      this.capEls = this.caps.map((c) => {
        const li = document.createElement("li");
        li.textContent = c[2];
        li.addEventListener("click", () => this.seek(c[0]));
        ol.appendChild(li);
        return li;
      });
      this.bar = side.querySelector(".uxf-progress i");
      this.btn = side.querySelector("[data-play]");
      this.btn.addEventListener("click", () => { this.playing = !this.playing; this.btn.textContent = this.playing ? "Pause" : "Play"; });
      side.querySelector("[data-restart]").addEventListener("click", () => this.seek(0));
      el.append(this.frame, side);
    }

    get still() { return reduce.matches || !!this.el.closest('[data-motion="off"]'); }
    q(sel) { return this.screen.querySelector(sel); }
    all(sel) { return [...(this.screen.matches(sel) ? [this.screen] : []), ...this.screen.querySelectorAll(sel)]; }

    reset() {
      this.screen.innerHTML = this.initial;
      this.pointer = this.q(".uxf-pointer");
      this.i = 0;
    }

    // Replays every step up to t with transitions off, so any moment of the loop can be shown exactly.
    seek(t) {
      this.screen.classList.add("uxf-cut");
      this.reset();
      this.screen.classList.add("uxf-cut");
      this.advance(t, true);
      this.t = t;
      this.paint();
      if (!this.still) requestAnimationFrame(() => requestAnimationFrame(() => this.screen.classList.remove("uxf-cut")));
    }

    advance(t, quick) {
      while (this.i < this.steps.length && this.steps[this.i][0] <= t) this.run(this.steps[this.i++], quick);
    }

    tick(dt) {
      if (!this.playing || !this.visible) return;
      this.t += dt;
      if (this.t > this.len) { this.seek(0); return; }
      if (this.still) this.screen.classList.add("uxf-cut");
      this.advance(this.t, this.still);
      this.paint();
    }

    paint() {
      this.bar.style.width = Math.min(100, (this.t / this.len) * 100) + "%";
      let k = -1;
      this.caps.forEach((c, j) => { if (c[0] <= this.t) k = j; });
      this.capEls.forEach((li, j) => { li.classList.toggle("on", j === k); li.classList.toggle("done", j < k); });
    }

    centre(sel) {
      const e = this.q(sel);
      if (!e) return null;
      const a = e.getBoundingClientRect(), b = this.screen.getBoundingClientRect();
      const s = b.width / this.screen.offsetWidth || 1; // the frame may be scaled with CSS
      return [(a.left - b.left + a.width / 2) / s, (a.top - b.top + a.height / 2) / s];
    }

    run([, op, a, b, c], quick) {
      const p = this.pointer;
      switch (op) {
        case "cap": break;
        case "view":
          this.screen.querySelectorAll(".uxf-view").forEach((v) => {
            const on = v.dataset.v === a;
            if (v.classList.contains("on") && !on) v.classList.add("back");
            if (on) v.classList.remove("back");
            v.classList.toggle("on", on);
          });
          break;
        case "move": {
          const xy = this.centre(a);
          if (!xy) break;
          p.classList.add("on");
          p.style.transitionDuration = b ? b + "ms" : "";
          p.style.left = xy[0] + "px";
          p.style.top = xy[1] + "px";
          break;
        }
        case "tap":
          if (quick) break;
          p.classList.remove("tap"); void p.offsetWidth; p.classList.add("tap", "down");
          setTimeout(() => p.classList.remove("down"), 160);
          break;
        case "hold": p.classList.toggle("down", !!a); break;
        case "hide": p.classList.remove("on"); break;
        case "cls": this.all(a).forEach((e) => e.classList.toggle(b, c !== false)); break;
        case "text": this.all(a).forEach((e) => (e.textContent = b)); break;
        case "html": this.all(a).forEach((e) => (e.innerHTML = b)); break;
        case "attr": this.all(a).forEach((e) => e.setAttribute(b, c)); break;
        case "scroll": {
          const e = this.q(a);
          if (e) { e.classList.add("uxf-scroll"); e.firstElementChild && (e.firstElementChild.style.transform = `translateY(${-b}px)`); }
          break;
        }
        default: console.warn("ux-flow: unknown op", op);
      }
    }
  }

  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(100, now - last);
    last = now;
    flows.forEach((f) => f.tick(dt));
    requestAnimationFrame(loop);
  };

  const mount = (el, def) => {
    if (!def) {
      const s = el.querySelector(':scope > script[type="application/json"]');
      def = { steps: s ? JSON.parse(s.textContent) : [] };
    }
    const f = new Flow(el, def);
    flows.push(f);
    return f;
  };

  window.UXFlow = {
    mount,
    refresh: () => flows.forEach((f) => f.seek(f.t)),
    flows,
  };

  const auto = () => {
    document.querySelectorAll(".uxf").forEach((el) => {
      if (!el.dataset.mounted) { el.dataset.mounted = "1"; mount(el); }
    });
    requestAnimationFrame(loop);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", auto) : auto();
})();
