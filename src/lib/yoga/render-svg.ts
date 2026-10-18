import type { FigureFrame, Limb, PoseFigure, PropItem } from "./figures";

/**
 * Renders a pose illustration to an SVG string. Colours use CSS variables so the
 * same markup works in light and dark mode; fallbacks keep standalone files readable.
 */
const C = {
  body: "rgb(var(--ink, 46 48 47) / 0.86)",
  far: "rgb(var(--ink, 46 48 47) / 0.32)",
  prop: "rgb(var(--sand, 233 223 204))",
  mat: "rgb(var(--sage, 118 142 114) / 0.35)",
  strap: "rgb(var(--clay, 176 132 104))",
  arrow: "rgb(var(--sage, 118 142 114))",
  caption: "rgb(var(--ink, 46 48 47) / 0.6)",
  halo: "rgb(var(--surface, 255 255 255))",
};

function limbPath(l: Limb): string {
  const [ax, ay] = l.a;
  const [bx, by] = l.b;
  const d = l.c ? `M ${ax} ${ay} Q ${l.c[0]} ${l.c[1]} ${bx} ${by}` : `M ${ax} ${ay} L ${bx} ${by}`;
  // a thin halo in the page colour separates overlapping limbs (arm in front of torso etc.)
  const halo = l.far || !l.halo ? "" : `<path d="${d}" fill="none" stroke="${C.halo}" stroke-width="${l.w + 4}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `${halo}<path d="${d}" fill="none" stroke="${l.far ? C.far : C.body}" stroke-width="${l.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function frameBounds(f: FigureFrame): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number, r = 0) => {
    x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r);
  };
  for (const l of f.limbs) { add(l.a[0], l.a[1], l.w / 2); add(l.b[0], l.b[1], l.w / 2); }
  add(f.head.x, f.head.y, f.head.r);
  for (const p of f.props ?? []) {
    const s = p.shape;
    if (s.t === "rect") { add(s.x, s.y); add(s.x + s.w, s.y + s.h); }
    else if (s.t === "ellipse") { add(s.cx - s.rx, s.cy - s.ry); add(s.cx + s.rx, s.cy + s.ry); }
    else if (s.t === "line") { add(s.a[0], s.a[1]); add(s.b[0], s.b[1]); }
  }
  if (f.caption) y1 = Math.max(y1, 292);
  return [x0, y0, x1, y1];
}

function propSvg(p: PropItem, id: string): string {
  const fill = p.role === "mat" ? C.mat : C.prop;
  const s = p.shape;
  switch (s.t) {
    case "rect":
      return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${s.r ?? 0}" fill="${fill}"/>`;
    case "ellipse":
      return `<ellipse cx="${s.cx}" cy="${s.cy}" rx="${s.rx}" ry="${s.ry}" fill="${fill}"/>`;
    case "line": {
      const stroke = p.role === "strap" ? C.strap : C.prop;
      return `<line x1="${s.a[0]}" y1="${s.a[1]}" x2="${s.b[0]}" y2="${s.b[1]}" stroke="${stroke}" stroke-width="${s.w ?? 4}" stroke-linecap="round"/>`;
    }
    case "path": {
      const stroke = p.role === "arrow" ? C.arrow : C.prop;
      const marker = s.arrow ? ` marker-end="url(#${id}-arrow)"` : "";
      return `<path d="${s.d}" fill="none" stroke="${stroke}" stroke-width="${s.w ?? 3}" stroke-linecap="round" stroke-dasharray="${p.role === "arrow" ? "2 7" : "0"}"${marker}/>`;
    }
  }
}

function frameSvg(f: FigureFrame, dx: number, id: string): string {
  const mats = (f.props ?? []).filter((p) => p.role === "mat");
  const others = (f.props ?? []).filter((p) => p.role !== "mat");
  const far = f.limbs.filter((l) => l.far);
  const near = f.limbs.filter((l) => !l.far);
  // straps are drawn on top of the body, other props underneath
  const under = others.filter((p) => p.role === "prop");
  const over = others.filter((p) => p.role !== "prop");
  return `<g transform="translate(${dx} 0)">
${mats.map((p) => propSvg(p, id)).join("")}
${far.map(limbPath).join("")}
${under.map((p) => propSvg(p, id)).join("")}
${near.map(limbPath).join("")}
<circle cx="${f.head.x}" cy="${f.head.y}" r="${f.head.r}" fill="${C.body}"/>
${over.map((p) => propSvg(p, id)).join("")}
${f.caption ? `<text x="${(frameBounds(f)[0] + frameBounds(f)[2]) / 2}" y="288" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="15" fill="${C.caption}">${f.caption}</text>` : ""}
</g>`;
}

export function renderPoseSvg(fig: PoseFigure, opts: { id: string; title?: string }): string {
  const id = opts.id.replace(/[^a-z0-9-]/gi, "");
  const pad = 18;
  const bounds = fig.frames.map(frameBounds);
  const top = Math.min(...bounds.map((b) => b[1]));
  const bottom = Math.max(...bounds.map((b) => b[3]));
  // multi-frame figures (cat–cow) are cropped horizontally so each frame stays large
  const multi = fig.frames.length > 1;
  const offsets: number[] = [];
  let width = 0;
  for (const b of bounds) {
    if (multi) {
      offsets.push(width - b[0] + pad);
      width += b[2] - b[0] + pad * 2;
    } else {
      offsets.push(0);
      width = 400;
    }
  }
  let y = top - pad;
  let h = bottom - top + pad * 2;
  const minH = 400 * 0.42; // keep a calm, not-too-panoramic aspect ratio
  if (h < minH) { y -= (minH - h) / 2; h = minH; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${Math.round(y)} ${Math.round(width)} ${Math.round(h)}" role="img"${opts.title ? ` aria-label="${opts.title.replace(/"/g, "&quot;")}"` : ""}>
<defs><marker id="${id}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${C.arrow}"/></marker></defs>
${fig.frames.map((f, i) => frameSvg(f, offsets[i], id)).join("\n")}
</svg>`;
}
