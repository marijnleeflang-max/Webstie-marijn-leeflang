/* Gedeelde helpers voor de slide-animaties.
   Elke animatie is een pure functie van tijd t (seconden) en herhaalt zich
   exact na DURATION seconden, zodat de video naadloos kan loopen. */
const SVGNS = "http://www.w3.org/2000/svg";
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
// 0 → 1 → 0: vloeiend in, even vast, vloeiend uit
const inHoldOut = (t, a, inDur, hold, outDur) =>
  easeOut(prog(t, a, a + inDur)) * (1 - easeInOut(prog(t, a + inDur + hold, a + inDur + hold + outDur)));
const mod = (a, n) => ((a % n) + n) % n;

function svgEl(tag, attrs, parent) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(el);
  return el;
}

/* Een rustige lijn met een korte lichtkomeet die eroverheen reist. */
class Comet {
  constructor(svg, d, { color = "#57c3ff", base = "rgba(140,180,230,.16)", width = 1.5, tail = 90 } = {}) {
    this.g = svgEl("g", {}, svg);
    this.baseLine = svgEl("path", { d, fill: "none", stroke: base, "stroke-width": width, "stroke-linecap": "round" }, this.g);
    this.L = this.baseLine.getTotalLength();
    this.tail = tail;
    const glow = svgEl("g", { style: `filter:drop-shadow(0 0 4px ${color}) drop-shadow(0 0 10px ${color})` }, this.g);
    this.layers = [
      [tail, width + 0.5, 0.18],
      [tail * 0.45, width + 1, 0.5],
      [tail * 0.16, width + 1.5, 1],
    ].map(([len, w, op]) => {
      const p = svgEl("path", { d, fill: "none", stroke: color, "stroke-width": w, "stroke-linecap": "round", opacity: op }, glow);
      p.style.strokeDasharray = `${len} ${this.L + tail + 10}`;
      p._len = len;
      return p;
    });
    this.head = svgEl("circle", { r: width + 1.6, fill: "#fff" }, glow);
  }
  /* p: 0..1 voortgang van de kop, van begin tot voorbij het einde (staart loopt uit) */
  set(p) {
    const vis = p > 0 && p < 1;
    const s = p * (this.L + this.tail);
    this.layers.forEach((l) => { l.style.strokeDashoffset = l._len - s; l.style.opacity = vis ? "" : 0; });
    const hs = Math.min(s, this.L);
    const pt = this.baseLine.getPointAtLength(hs);
    this.head.setAttribute("cx", pt.x);
    this.head.setAttribute("cy", pt.y);
    this.head.setAttribute("opacity", vis && s <= this.L ? 1 : 0);
  }
}

/* Laat de pagina live afspelen, tenzij ?render in de URL staat (dan stuurt render.mjs de tijd). */
function start(renderAt, duration) {
  window.renderAt = renderAt;
  window.DURATION = duration;
  document.fonts.ready.then(() => {
    window.READY = true;
    if (location.search.includes("render")) { renderAt(0); return; }
    const t0 = performance.now();
    (function loop(now) { renderAt(((now - t0) / 1000) % duration); requestAnimationFrame(loop); })(t0);
  });
}
