import type { FigureFrame, Limb, PoseFigure, PropItem } from "./figures";

/**
 * Renders a pose illustration to an SVG string. Colours use CSS variables so the
 * same markup works in light and dark mode; fallbacks keep standalone files readable.
 */
const C = {
  body: "rgb(var(--sage-deep, 78 99 75) / 0.94)",
  far: "rgb(var(--sage, 118 142 114) / 0.42)",
  prop: "rgb(var(--sand, 233 223 204))",
  mat: "rgb(var(--sage, 118 142 114) / 0.28)",
  shadow: "rgb(var(--ink, 46 48 47) / 0.08)",
  strap: "rgb(var(--clay, 176 132 104))",
  arrow: "rgb(var(--sage, 118 142 114))",
  caption: "rgb(var(--ink, 46 48 47) / 0.6)",
  note: "rgb(var(--ink, 46 48 47) / 0.72)",
  noteLine: "rgb(var(--clay, 176 132 104) / 0.8)",
  halo: "rgb(var(--surface, 255 255 255))",
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Filled capsule between two circles of different radii (a tapered limb segment). */
function capsule(ax: number, ay: number, ra: number, bx: number, by: number, rb: number): string {
  const dx = bx - ax, dy = by - ay;
  const d = Math.hypot(dx, dy) || 0.001;
  const ux = dx / d, uy = dy / d;
  const k = Math.max(-0.99, Math.min(0.99, (ra - rb) / d));
  const cos = k, sin = Math.sqrt(1 - k * k);
  // outward normals of the two tangent lines
  const n1x = ux * cos - uy * sin, n1y = uy * cos + ux * sin;
  const n2x = ux * cos + uy * sin, n2y = uy * cos - ux * sin;
  const pts = [
    [ax + n1x * ra, ay + n1y * ra], [bx + n1x * rb, by + n1y * rb],
    [bx + n2x * rb, by + n2y * rb], [ax + n2x * ra, ay + n2y * ra],
  ].map(([x, y]) => `${r1(x)},${r1(y)}`).join(" ");
  return `<polygon points="${pts}"/><circle cx="${r1(ax)}" cy="${r1(ay)}" r="${r1(ra)}"/><circle cx="${r1(bx)}" cy="${r1(by)}" r="${r1(rb)}"/>`;
}

function limbShape(l: Limb, grow = 0): string {
  const [ax, ay] = l.a;
  const [bx, by] = l.b;
  const torso = l.w >= 26;
  const ra = (l.w / 2) * (torso ? 1 : 1.08) + grow;
  const rb = (l.w / 2) * (torso ? 0.94 : 0.8) + grow;
  if (l.end === "foot") {
    // a foot: an elongated rounded wedge from the heel to the toes
    const len = Math.hypot(bx - ax, by - ay) + 5;
    const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
    const cx = (ax + bx) / 2, cy = (ay + by) / 2;
    return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(len / 2 + 2 + grow)}" ry="${r1(l.w * 0.48 + grow)}" transform="rotate(${r1(ang)} ${r1(cx)} ${r1(cy)})"/>`;
  }
  let out = "";
  if (l.c) {
    const steps = 10;
    let px = ax, py = ay, pr = ra;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * l.c[0] + t * t * bx;
      const y = (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * l.c[1] + t * t * by;
      const r = ra + (rb - ra) * t;
      out += capsule(px, py, pr, x, y, r);
      px = x; py = y; pr = r;
    }
  } else {
    out = capsule(ax, ay, ra, bx, by, rb);
  }
  if (l.end === "hand") {
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const hx = bx + ((bx - ax) / d) * 5, hy = by + ((by - ay) / d) * 5;
    out += `<circle cx="${r1(hx)}" cy="${r1(hy)}" r="${r1(l.w * 0.52 + grow)}"/>`;
  }
  return out;
}

function limbPath(l: Limb): string {
  const halo = l.far || !l.halo ? "" : `<g fill="${C.halo}">${limbShape(l, 2)}</g>`;
  return `${halo}<g fill="${l.far ? C.far : C.body}">${limbShape(l)}</g>`;
}

const noteWidth = (text: string) => text.length * 7.1;

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
  for (const n of f.notes ?? []) {
    add(n.p[0], n.p[1]);
    add(n.t[0], n.t[1] - 14);
    add(n.t[0] + noteWidth(n.text), n.t[1] + 4);
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

function frameSvg(f: FigureFrame, dx: number, id: string, showNotes: boolean): string {
  const mats = (f.props ?? []).filter((p) => p.role === "mat");
  const others = (f.props ?? []).filter((p) => p.role !== "mat");
  const far = f.limbs.filter((l) => l.far);
  const near = f.limbs.filter((l) => !l.far);
  // straps are drawn on top of the body, other props underneath
  const under = others.filter((p) => p.role === "prop");
  const over = others.filter((p) => p.role !== "prop");
  const xs = f.limbs.flatMap((l) => [l.a[0], l.b[0]]);
  const shadow = f.view === "top" ? "" : `<ellipse cx="${r1((Math.min(...xs) + Math.max(...xs)) / 2)}" cy="251" rx="${r1((Math.max(...xs) - Math.min(...xs)) / 2 + 12)}" ry="5" fill="${C.shadow}"/>`;
  const notes = (f.notes ?? [])
    .map((n) => {
      const tx = n.t[0], ty = n.t[1];
      const lx = Math.min(Math.max(n.p[0], tx), tx + noteWidth(n.text));
      return `<line x1="${n.p[0]}" y1="${n.p[1]}" x2="${r1(lx)}" y2="${ty + 5}" stroke="${C.noteLine}" stroke-width="1.2" stroke-dasharray="2 3"/><circle cx="${n.p[0]}" cy="${n.p[1]}" r="3" fill="${C.noteLine}"/><text x="${tx}" y="${ty}" font-family="-apple-system, system-ui, sans-serif" font-size="13" fill="${C.note}">${n.text}</text>`;
    })
    .join("");
  return `<g transform="translate(${dx} 0)">
${mats.map((p) => propSvg(p, id)).join("")}
${shadow}
${far.map(limbPath).join("")}
${under.map((p) => propSvg(p, id)).join("")}
${near.map(limbPath).join("")}
<circle cx="${f.head.x}" cy="${f.head.y}" r="${f.head.r}" fill="${C.body}"/>
${over.map((p) => propSvg(p, id)).join("")}
${showNotes ? notes : ""}
${f.caption ? `<text x="${(frameBounds(f)[0] + frameBounds(f)[2]) / 2}" y="288" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="15" fill="${C.caption}">${f.caption}</text>` : ""}
</g>`;
}

export function renderPoseSvg(fig: PoseFigure, opts: { id: string; title?: string; notes?: boolean }): string {
  const showNotes = opts.notes ?? true;
  const id = opts.id.replace(/[^a-z0-9-]/gi, "");
  const pad = 18;
  const bounds = fig.frames.map((f) => frameBounds(showNotes ? f : { ...f, notes: undefined }));
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
${fig.frames.map((f, i) => frameSvg(f, offsets[i], id, showNotes)).join("\n")}
</svg>`;
}
