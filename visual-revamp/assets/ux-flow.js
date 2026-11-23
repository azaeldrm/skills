// UX flow player: plays a scripted flow in one or more device frames, with its steps listed beside it.
// No dependencies. Include ux-flow.css and this file (or inline both; nothing in them closes a tag).
//
// One device: put the views straight inside the flow.
//   <div class="uxf" data-title="Sign in" data-frame="phone">
//     <div class="uxf-view" data-v="start">...</div>
//     <div class="uxf-view" data-v="done">...</div>
//     <script type="application/json"> [[0,"view","start"], [400,"cap","Tap Continue"], ...] (close the tag)
//   </div>
//
// Same flow on several devices, side by side and in sync: one .uxf-device per frame, each with its own
// views built for that screen size. Every step runs on every device; prefix an op with a device name
// ("phone:tap", "desktop:move") to run it on that device only. A device's name is data-name, else its frame.
//   <div class="uxf" data-title="Write a note">
//     <div class="uxf-device" data-frame="desktop" data-label="Web"> views </div>
//     <div class="uxf-device" data-frame="phone" data-label="Phone"> views </div>
//     <script type="application/json"> steps (close the tag)
//   </div>
//
// Frames: phone, tablet, desktop, none. Frames scale down to fit the flow's box (the box's height is
// --uxf-h, or 100% inside a fixed-height parent such as a gallery page). Wide: all devices side by side.
// Narrow (flow under 760px): only the phone, since a scaled-down web frame is unreadable there. Set
// data-narrow="switch" on the flow to show one device at a time with buttons to switch instead (the
// others keep playing in sync, so switching lands on the same moment).
//
// Tabs or menus where the nav stays put and only the content changes: use one view per device and swap
// the content with cls steps (toggle an "on" class on panes), not separate views, which slide.
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
// A flow plays only while most of it is on screen, and starts from step 1 each time it comes into view
// (so a reader never lands on a flow that is already halfway through). It loops; clicking a step jumps
// to it. Motion is off (instant cuts, no pointer travel) when an ancestor has data-motion="off" or the
// OS asks for reduced motion. After changing theme or motion, call UXFlow.refresh().
(() => {
  const flows = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  const expand = (steps) => {
    const out = [];
    for (const s of steps) {
      const op = String(s[1]).split(":").pop();
      if (op !== "type") { out.push(s); continue; }
      const scope = String(s[1]).includes(":") ? String(s[1]).split(":")[0] + ":" : "";
      const [t, , sel, value, per = 45] = s;
      for (let k = 1; k <= value.length; k++) out.push([t + (k - 1) * per, scope + "text", sel, value.slice(0, k)]);
    }
    return out.sort((a, b) => a[0] - b[0]);
  };

  class Device {
    constructor(src, frame) {
      this.name = src.dataset.name || frame;
      this.box = document.createElement("div");
      this.box.className = "uxf-device";
      this.frame = document.createElement("div");
      this.frame.className = "uxf-frame uxf-" + frame;
      this.screen = document.createElement("div");
      this.screen.className = "uxf-screen";
      [...src.children].forEach((v) => this.screen.appendChild(v));
      const p = document.createElement("div");
      p.className = "uxf-pointer";
      this.screen.appendChild(p);
      this.frame.appendChild(this.screen);
      this.box.appendChild(this.frame);
      if (src.dataset.label) {
        const l = document.createElement("div");
        l.className = "uxf-label";
        l.textContent = src.dataset.label;
        this.box.appendChild(l);
      }
      this.initial = this.screen.innerHTML;
    }
    reset() { this.screen.innerHTML = this.initial; this.pointer = this.screen.querySelector(".uxf-pointer"); }
    q(sel) { return this.screen.querySelector(sel); }
    all(sel) { return [...(this.screen.matches(sel) ? [this.screen] : []), ...this.screen.querySelectorAll(sel)]; }
    centre(sel) {
      const e = this.q(sel);
      if (!e) return null;
      const a = e.getBoundingClientRect(), b = this.screen.getBoundingClientRect();
      const s = b.width / this.screen.offsetWidth || 1; // the frame is scaled to fit
      return [(a.left - b.left + a.width / 2) / s, (a.top - b.top + a.height / 2) / s];
    }
  }

  class Flow {
    constructor(el, def) {
      this.el = el;
      this.steps = expand(def.steps || []);
      this.len = def.len || (this.steps.length ? this.steps[this.steps.length - 1][0] + 1800 : 3000);
      this.caps = this.steps.filter((s) => s[1] === "cap");
      this.build(def);
      this.t = 0; this.i = 0; this.playing = true; this.visible = false;
      this.seek(0);
      new ResizeObserver(() => this.fit()).observe(this.stage);
      // "Mostly on screen": 60% of the flow, or of the viewport when the flow is taller than it.
      new IntersectionObserver(([e]) => {
        const need = 0.6 * Math.min(e.boundingClientRect.height, innerHeight);
        const now = e.isIntersecting && e.intersectionRect.height >= need;
        if (now && !this.visible) this.seek(0);
        this.visible = now;
      }, { threshold: [0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1] }).observe(el);
    }

    build(def) {
      const el = this.el;
      const kids = [...el.children].filter((c) => !c.matches("script"));
      const multi = kids.some((c) => c.classList.contains("uxf-device"));
      const frame = def.frame || el.dataset.frame || "phone";
      if (multi) {
        this.devices = kids.filter((c) => c.classList.contains("uxf-device")).map((c) => new Device(c, c.dataset.frame || frame));
      } else {
        const holder = document.createElement("div");
        kids.forEach((k) => holder.appendChild(k));
        this.devices = [new Device(holder, frame)];
      }
      el.innerHTML = "";
      el.classList.add("uxf");

      const body = document.createElement("div");
      body.className = "uxf-body";
      this.stage = document.createElement("div");
      this.stage.className = "uxf-stage";
      this.devices.forEach((d) => this.stage.appendChild(d.box));
      const ph = this.devices.findIndex((d) => d.frame.classList.contains("uxf-phone"));
      this.shown = ph < 0 ? 0 : ph;
      if (this.devices.length > 1) {
        ["prev", "next"].forEach((dir, k) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "uxf-switch uxf-" + dir;
          b.setAttribute("aria-label", k ? "Next device" : "Previous device");
          b.textContent = k ? "›" : "‹";
          b.addEventListener("click", () => this.show(this.shown + (k ? 1 : -1)));
          this.stage.appendChild(b);
        });
      }

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
      const ghost = document.createElement("li");
      ghost.className = "on uxf-ghost";
      ghost.setAttribute("aria-hidden", "true");
      ghost.textContent = "\u00a0";
      ol.appendChild(ghost);
      this.bar = side.querySelector(".uxf-progress i");
      this.btn = side.querySelector("[data-play]");
      this.btn.addEventListener("click", () => { this.playing = !this.playing; this.btn.textContent = this.playing ? "Pause" : "Play"; });
      side.querySelector("[data-restart]").addEventListener("click", () => this.seek(0));
      body.append(this.stage, side);
      el.appendChild(body);
    }

    show(i) {
      const n = this.devices.length;
      this.shown = ((i % n) + n) % n;
      this.fit();
    }

    // Wide: scale every frame to one common height, side by side, so the devices read as one flow.
    // Narrow: only the shown device, as big as it fits. Never scales up.
    fit() {
      const cs = getComputedStyle(this.stage);
      const W = this.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const H = this.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (W <= 0 || H <= 0) return;
      const single = this.devices.length > 1 && this.el.clientWidth < 760;
      const switching = single && this.el.dataset.narrow === "switch";
      if (single && !switching) {
        const ph = this.devices.findIndex((d) => d.frame.classList.contains("uxf-phone"));
        if (ph >= 0) this.shown = ph;
      }
      this.stage.classList.toggle("uxf-single", single);
      this.stage.classList.toggle("uxf-switching", switching);
      const on = single ? [this.devices[this.shown]] : this.devices;
      this.devices.forEach((d) => d.box.classList.toggle("uxf-off", !on.includes(d)));
      const room = switching ? 2 * 44 : 0; // the switch buttons sit either side
      const gap = parseFloat(cs.columnGap) || 24;
      const dims = on.map((d) => [d.frame.offsetWidth, d.frame.offsetHeight, d.box.querySelector(".uxf-label") ? 28 : 0]);
      const n = dims.length, lab = Math.max(...dims.map((x) => x[2]));
      const maxH = Math.min(...dims.map((x) => x[1]));
      const ratio = dims.reduce((s, [w, h]) => s + w / h, 0);
      const h = Math.max(1, Math.min(maxH, H - lab, (W - room - gap * (n - 1)) / ratio));
      on.forEach((d, i) => {
        const s = h / dims[i][1];
        d.frame.style.transform = `scale(${s})`;
        d.box.style.width = dims[i][0] * s + "px";
        d.box.style.setProperty("--uxf-fh", dims[i][1] * s + "px");
      });
    }

    get still() { return reduce.matches || !!this.el.closest('[data-motion="off"]'); }

    // Replays every step up to t with transitions off, so any moment of the loop can be shown exactly.
    seek(t) {
      this.devices.forEach((d) => { d.screen.classList.add("uxf-cut"); d.reset(); d.screen.classList.add("uxf-cut"); });
      this.i = 0;
      this.advance(t, true);
      this.t = t;
      this.paint();
      if (!this.still) requestAnimationFrame(() => requestAnimationFrame(() => this.devices.forEach((d) => d.screen.classList.remove("uxf-cut"))));
    }

    advance(t, quick) {
      while (this.i < this.steps.length && this.steps[this.i][0] <= t) this.run(this.steps[this.i++], quick);
    }

    tick(dt) {
      if (!this.playing || !this.visible) return;
      this.t += dt;
      if (this.t > this.len) { this.seek(0); return; }
      if (this.still) this.devices.forEach((d) => d.screen.classList.add("uxf-cut"));
      this.advance(this.t, this.still);
      this.paint();
    }

    paint() {
      this.bar.style.width = Math.min(100, (this.t / this.len) * 100) + "%";
      let k = -1;
      this.caps.forEach((c, j) => { if (c[0] <= this.t) k = j; });
      this.capEls.forEach((li, j) => { li.classList.toggle("on", j === k); li.classList.toggle("done", j < k); });
    }

    run(step, quick) {
      const [, raw] = step;
      const parts = String(raw).split(":");
      const op = parts.pop(), only = parts[0];
      if (op === "cap") return;
      this.devices.forEach((d) => { if (!only || only === d.name) this.runOn(d, op, step, quick); });
    }

    runOn(d, op, [, , a, b, c], quick) {
      const p = d.pointer;
      switch (op) {
        case "view":
          d.screen.querySelectorAll(".uxf-view").forEach((v) => {
            const on = v.dataset.v === a;
            if (v.classList.contains("on") && !on) v.classList.add("back");
            if (on) v.classList.remove("back");
            v.classList.toggle("on", on);
          });
          break;
        case "move": {
          const xy = d.centre(a);
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
        case "cls": d.all(a).forEach((e) => e.classList.toggle(b, c !== false)); break;
        case "text": d.all(a).forEach((e) => (e.textContent = b)); break;
        case "html": d.all(a).forEach((e) => (e.innerHTML = b)); break;
        case "attr": d.all(a).forEach((e) => e.setAttribute(b, c)); break;
        case "scroll": {
          const e = d.q(a);
          if (e && e.firstElementChild) { e.classList.add("uxf-scroll"); e.firstElementChild.style.transform = `translateY(${-b}px)`; }
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
    el.dataset.mounted = "1";
    const f = new Flow(el, def);
    flows.push(f);
    return f;
  };

  window.UXFlow = {
    mount,
    refresh: () => flows.forEach((f) => { f.fit(); f.seek(f.t); }),
    flows,
  };

  const auto = () => {
    document.querySelectorAll(".uxf:not([data-mounted])").forEach((el) => mount(el));
    requestAnimationFrame(loop);
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", auto) : auto();
})();
