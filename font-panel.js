// A bench for the page's TYPE, not part of the piece: index.html only loads
// this when the URL carries ?fonts. It sets the three --ui-* custom properties
// the stylesheet already reads (see the note under :root), so everything it
// does is undone by deleting three inline properties -- and by simply not
// asking for it, the page is exactly as written.
//
// It reaches the nav, its menu and the corners. The vine and the bee are a
// character GRID drawn in one font for reasons that have nothing to do with
// how it looks, and are left alone.
(function () {
  "use strict";

  // The page's own face first, and the ones it replaced, then two families
  // grown out of the two that were liked: display serifs in Instrument Serif's
  // vein -- high
  // contrast, a little condensed, built for size -- and monos in DM Mono's,
  // geometric and light rather than code-editor sturdy. Xanh Mono sits between
  // them: a monospace with serifs. The text field takes any family on Google
  // Fonts by name, so this is a shortlist and not a limit.
  var GROUPS = [
    ["Current", ["JetBrains Mono"]],
    ["Previous", ["VT323", "Playfair Display", "DM Mono"]],
    ["Like Instrument Serif", [
      "Instrument Serif", "DM Serif Display", "Gloock", "Young Serif",
      "Bodoni Moda", "Libre Caslon Display", "Gilda Display",
      "Italiana", "Newsreader", "Fraunces", "Cormorant Garamond"]],
    ["Like DM Mono", [
      "Fragment Mono", "Geist Mono", "Red Hat Mono", "Martian Mono",
      "Azeret Mono", "Spline Sans Mono", "Chivo Mono", "Sometype Mono",
      "IBM Plex Mono", "Space Mono"]],
    ["More monos", [
      "Roboto Mono", "Source Code Pro", "Fira Code", "Fira Mono", "Inconsolata",
      "Ubuntu Mono", "Overpass Mono", "Anonymous Pro", "Cutive Mono", "Nova Mono",
      "Share Tech Mono", "Major Mono Display", "B612 Mono", "Oxygen Mono",
      "PT Mono", "Syne Mono", "Victor Mono", "Sono",
      "Kode Mono", "Reddit Mono", "Lekton", "M PLUS 1 Code", "Noto Sans Mono",
      "Cousine", "Nanum Gothic Coding"]],
    ["Between the two", ["Xanh Mono", "Courier Prime"]]
  ];
  var FONTS = [].concat.apply([], GROUPS.map(function (g) { return g[1]; }));
  var KEY = "misket:fontpanel";
  var root = document.documentElement.style;

  var state = { font: "JetBrains Mono", weight: 400, size: 1, open: true };
  try { var saved = JSON.parse(localStorage.getItem(KEY)); if (saved) for (var k in saved) state[k] = saved[k]; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // Which weights a family has is not something the browser can be asked, and
  // Google answers a request for a weight a family lacks with a 400 rather than
  // a fallback. So: try the variable range first, which is one request for the
  // families that have an axis, and otherwise ask for each weight on its own
  // and keep whichever come back. The CSS is fetched and injected rather than
  // linked so that a failure is a status code to read, not a silent no-op.
  var loaded = {};                // family -> available weights
  function load(family) {
    if (loaded[family]) return Promise.resolve(loaded[family]);
    var q = "https://fonts.googleapis.com/css2?display=swap&family=" + encodeURIComponent(family).replace(/%20/g, "+");
    function get(url) { return fetch(url).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }); }
    return get(q + ":wght@100..900").then(function (css) {
      if (css) return { css: css, weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], variable: true };
      var ws = [100, 200, 300, 400, 500, 600, 700, 800, 900];
      return Promise.all(ws.map(function (w) { return get(q + ":wght@" + w); })).then(function (all) {
        var css = "", have = [];
        all.forEach(function (c, i) { if (c) { css += c; have.push(ws[i]); } });
        return have.length ? { css: css, weights: have } : null;
      });
    }).then(function (res) {
      if (!res) return null;
      var st = document.createElement("style");
      st.textContent = res.css;
      document.head.appendChild(st);
      return (loaded[family] = res.weights);
    });
  }

  // The bee aims at the nav's boxes and the reveal measures them once; both
  // keep what they measured until a resize. A new face or size is a new box,
  // so say "resize" once the face has actually arrived, or they keep flying to
  // and lighting up where the words used to be.
  function settle() {
    var spec = state.weight + " 40px \"" + state.font + "\"";
    (document.fonts ? document.fonts.load(spec, "AZ") : Promise.resolve())
      .catch(function () {})
      .then(function () { window.dispatchEvent(new Event("resize")); });
  }

  function apply() {
    root.setProperty("--ui-font", "\"" + state.font + "\"");
    root.setProperty("--ui-weight", state.weight);
    root.setProperty("--ui-size", state.size);
    sizeOut.textContent = Math.round(state.size * 100) + "%";
    weightOut.textContent = state.weight;
    css.textContent = "font-family: \"" + state.font + "\", monospace;\nfont-weight: " +
      state.weight + ";\n/* every size × " + (+state.size).toFixed(2) + " */";
    save();
    settle();
  }

  // Snap a weight onto the nearest one the family actually has, so the slider
  // never sits on a value the browser would synthesise or ignore.
  function nearest(ws, w) {
    return ws.reduce(function (a, b) { return Math.abs(b - w) < Math.abs(a - w) ? b : a; });
  }

  function choose(family) {
    status.textContent = "loading…";
    load(family).then(function (ws) {
      if (!ws) { status.textContent = "“" + family + "” not on Google Fonts"; return; }
      state.font = family;
      avail = ws;
      state.weight = nearest(ws, state.weight);
      weight.value = state.weight;
      status.textContent = ws.length === 9 ? "weights 100–900" : "weights " + ws.join(" ");
      if (pick.value !== family) pick.value = FONTS.indexOf(family) >= 0 ? family : "";
      apply();
    });
  }

  /* ---- the panel ------------------------------------------------------- */

  // Its own look, in the system face, so it can never be mistaken for the
  // type it is adjusting -- and fixed bottom-right over everything, where on a
  // phone it covers GitHub's empty corner rather than the nav column.
  var style = document.createElement("style");
  style.textContent =
    "#fontpanel{position:fixed;right:12px;bottom:12px;z-index:1000;width:240px;" +
    "max-width:calc(100vw - 24px);padding:12px;border:1px solid #333;border-radius:8px;" +
    "background:rgba(10,10,10,.92);color:#ddd;font:12px/1.4 system-ui,-apple-system,sans-serif;" +
    "letter-spacing:0;text-transform:none;box-shadow:0 8px 30px rgba(0,0,0,.6)}" +
    "#fontpanel.shut>:not(.hd){display:none}" +
    "#fontpanel .hd{display:flex;justify-content:space-between;align-items:center;cursor:pointer;" +
    "font-weight:600;color:#fff;user-select:none}" +
    "#fontpanel label{display:block;margin-top:10px;color:#999}" +
    "#fontpanel label b{float:right;color:#fff;font-weight:500}" +
    "#fontpanel select,#fontpanel input[type=text]{width:100%;margin-top:4px;padding:5px 6px;" +
    "border:1px solid #444;border-radius:4px;background:#1a1a1a;color:#fff;font:inherit}" +
    "#fontpanel input[type=range]{width:100%;margin-top:4px;accent-color:#ff3131}" +
    "#fontpanel .st{margin-top:4px;color:#777;font-size:11px;min-height:1.4em}" +
    "#fontpanel pre{margin-top:10px;padding:6px;border-radius:4px;background:#1a1a1a;color:#aaa;" +
    "font:11px/1.4 ui-monospace,Menlo,monospace;white-space:pre-wrap}" +
    "#fontpanel .row{display:flex;gap:6px;margin-top:10px}" +
    "#fontpanel button{flex:1;padding:5px;border:1px solid #444;border-radius:4px;background:#1a1a1a;" +
    "color:#ddd;font:inherit;cursor:pointer}#fontpanel button:hover{border-color:#777;color:#fff}";
  document.head.appendChild(style);

  var panel = document.createElement("div");
  panel.id = "fontpanel";
  panel.innerHTML =
    '<div class="hd"><span>Type</span><span class="tg"></span></div>' +
    '<label>Font<select class="pick"></select></label>' +
    '<input type="text" class="any" placeholder="or any Google Font, then Enter">' +
    '<div class="st"></div>' +
    '<label>Weight <b class="wo"></b><input type="range" class="weight" min="100" max="900" step="100"></label>' +
    '<label>Size <b class="so"></b><input type="range" class="size" min="0.5" max="2" step="0.05"></label>' +
    '<pre class="css"></pre>' +
    '<div class="row"><button type="button" class="copy">Copy CSS</button>' +
    '<button type="button" class="reset">Reset</button></div>';
  document.body.appendChild(panel);

  function $(c) { return panel.querySelector(c); }
  var pick = $(".pick"), any = $(".any"), status = $(".st"), weight = $(".weight"),
      size = $(".size"), weightOut = $(".wo"), sizeOut = $(".so"), css = $(".css"),
      toggle = $(".tg"), avail = [400];

  pick.innerHTML = '<option value="">— custom —</option>' +
    GROUPS.map(function (g) {
      return '<optgroup label="' + g[0] + '">' +
        g[1].map(function (f) { return "<option>" + f + "</option>"; }).join("") + "</optgroup>";
    }).join("");

  function setOpen(o) {
    state.open = o;
    panel.classList.toggle("shut", !o);
    toggle.textContent = o ? "–" : "+";
    save();
  }
  $(".hd").addEventListener("click", function () { setOpen(!state.open); });

  pick.addEventListener("change", function () { if (pick.value) { any.value = ""; choose(pick.value); } });
  any.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && any.value.trim()) choose(any.value.trim());
  });
  weight.addEventListener("input", function () {
    state.weight = nearest(avail, +weight.value);
    weight.value = state.weight;
    apply();
  });
  size.addEventListener("input", function () { state.size = +size.value; apply(); });
  $(".copy").addEventListener("click", function () {
    var b = this;
    if (navigator.clipboard) navigator.clipboard.writeText(css.textContent).then(function () {
      b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy CSS"; }, 1200);
    });
  });
  $(".reset").addEventListener("click", function () {
    state.size = 1; size.value = 1; state.weight = 400;
    any.value = ""; pick.value = "JetBrains Mono"; choose("JetBrains Mono");
  });

  var cursor = -1;
  pick.addEventListener("change", function () { cursor = FONTS.indexOf(pick.value); });
  // < and > (or , and .) step through the fonts, up and down arrows change
  // the size. They work whether the panel is open or shut, and while a select,
  // slider or button in it has focus; only a text field keeps its own keys.
  document.addEventListener("keydown", function (e) {
    var t = e.target, tag = t && t.tagName;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (tag === "TEXTAREA" || (t && t.isContentEditable) ||
        (tag === "INPUT" && t.type !== "range" && t.type !== "checkbox")) return;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      state.size = Math.min(2, Math.max(0.5, Math.round((state.size + (e.key === "ArrowUp" ? 0.05 : -0.05)) * 100) / 100));
      size.value = state.size;
      apply();
      return;
    }
    var dir = (e.key === "<" || e.key === ",") ? -1 : (e.key === ">" || e.key === ".") ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    // step from where the last press LANDED, not from the font in force: a
    // family that fails to load never becomes state.font, and stepping from
    // that would hit the same dead one on every press and go nowhere.
    var i = cursor >= 0 ? cursor : FONTS.indexOf(state.font);
    i = i < 0 ? (dir > 0 ? 0 : FONTS.length - 1) : (i + dir + FONTS.length) % FONTS.length;
    cursor = i;
    any.value = "";
    pick.value = FONTS[i];
    choose(FONTS[i]);
  });

  weight.value = state.weight;
  size.value = state.size;
  setOpen(state.open);
  if (FONTS.indexOf(state.font) < 0) any.value = state.font;
  choose(state.font);
})();
