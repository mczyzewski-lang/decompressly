/**
 * Hand-built pose illustrations (side or top view). Each limb is a thick rounded stroke
 * between joints; quadratic control points shape the spine (e.g. cat vs cow).
 * Coordinates live in a 400×300 frame, floor at y = 250.
 */
export type Pt = [number, number];

export interface Limb {
  a: Pt;
  b: Pt;
  c?: Pt;
  w: number;
  far?: boolean;
  /** draw a thin outline so the limb reads in front of the torso */
  halo?: boolean;
  /** draw a hand at the end of a forearm, or render the segment as a foot */
  end?: "hand" | "foot";
}

/** A short label with a leader line, pointing at what matters in the pose. */
export interface Note {
  p: Pt;
  t: Pt;
  text: string;
}

export type PropShape =
  | { t: "rect"; x: number; y: number; w: number; h: number; r?: number }
  | { t: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { t: "line"; a: Pt; b: Pt; w?: number }
  | { t: "path"; d: string; w?: number; arrow?: boolean };

export interface PropItem {
  role: "prop" | "strap" | "arrow" | "mat";
  shape: PropShape;
}

export interface FigureFrame {
  head: { x: number; y: number; r: number };
  limbs: Limb[];
  props?: PropItem[];
  caption?: string;
  view?: "side" | "top" | "front";
  notes?: Note[];
}

export interface PoseFigure {
  frames: FigureFrame[];
}

const T = 28; // torso
const UA = 13; // upper arm
const FA = 11; // forearm
const TH = 20; // thigh
const SH = 15; // shin
const FT = 9; // foot
const NK = 11; // neck

const off = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];

const sideMat: PropItem = { role: "mat", shape: { t: "rect", x: 24, y: 250, w: 352, h: 8, r: 4 } };

function catCowFrame(kind: "cow" | "cat"): FigureFrame {
  const H: Pt = [140, 170];
  const K: Pt = [140, 240];
  const A: Pt = [80, 244];
  const S: Pt = kind === "cow" ? [240, 174] : [240, 178];
  const E: Pt = [240, 210];
  const W: Pt = [240, 244];
  const neckEnd: Pt = kind === "cow" ? [262, 162] : [254, 192];
  const head = kind === "cow" ? { x: 276, y: 154, r: 16 } : { x: 260, y: 206, r: 16 };
  const ctrl: Pt = kind === "cow" ? [190, 200] : [190, 132];
  return {
    head,
    caption: kind === "cow" ? "Wdech — krowa" : "Wydech — kot",
    limbs: [
      { a: off(H, -4, -2), b: off(K, -4, -2), w: TH, far: true },
      { a: off(K, -4, -2), b: off(A, -4, -2), w: SH, far: true },
      { a: off(S, -4, -2), b: off(E, -4, -2), w: UA, far: true },
      { a: off(E, -4, -2), b: off(W, -4, -2), w: FA, far: true, end: "hand" },
      { a: H, b: S, c: ctrl, w: T },
      { a: S, b: neckEnd, w: NK },
      { a: H, b: K, w: TH },
      { a: K, b: A, w: SH },
      { a: A, b: [66, 246], w: FT, end: "foot" },
      { a: S, b: E, w: UA, halo: true },
      { a: E, b: W, w: FA, halo: true, end: "hand" as const },
      { a: W, b: [254, 246], w: FT - 1, end: "foot" },
    ],
    props: [{ role: "mat", shape: { t: "rect", x: 50, y: 250, w: 250, h: 8, r: 4 } }],
  };
}

function seatedFrame(withArrow: boolean): FigureFrame {
  const H: Pt = [196, 222];
  const S: Pt = [198, 142];
  return {
    head: { x: 204, y: 110, r: 16 },
    limbs: [
      { a: H, b: [256, 232], w: TH, far: true },
      { a: [256, 232], b: [222, 242], w: SH, far: true },
      { a: S, b: [206, 188], w: UA, far: true },
      { a: [206, 188], b: [240, 220], w: FA, far: true, end: "hand" },
      { a: H, b: S, c: [190, 184], w: T },
      { a: S, b: [202, 126], w: NK },
      { a: H, b: [264, 238], w: TH },
      { a: [264, 238], b: [214, 245], w: SH },
      { a: [214, 245], b: [200, 247], w: FT, end: "foot" },
      ...(withArrow
        ? [
            { a: S, b: [198, 188] as Pt, w: UA, halo: true },
            { a: [198, 188] as Pt, b: [226, 220] as Pt, w: FA, halo: true, end: "hand" as const },
          ]
        : [
            { a: S, b: [212, 186] as Pt, w: UA, halo: true },
            { a: [212, 186] as Pt, b: [250, 222] as Pt, w: FA, halo: true, end: "hand" as const },
          ]),
    ],
    props: [
      sideMat,
      { role: "prop", shape: { t: "rect", x: 148, y: 226, w: 100, h: 24, r: 10 } },
      ...(withArrow
        ? [{ role: "arrow" as const, shape: { t: "path" as const, d: "M 184 116 A 28 28 0 0 0 178 168", arrow: true } }]
        : []),
    ],
  };
}

const supineBase = (H: Pt) => ({ S: [96, 237] as Pt, H });

export const FIGURES: Record<string, PoseFigure> = {
  seated: { frames: [seatedFrame(false)] },
  shoulders: { frames: [seatedFrame(true)] },
  catcow: { frames: [catCowFrame("cow"), catCowFrame("cat")] },
  child: {
    frames: [
      {
        head: { x: 238, y: 233, r: 15 },
        limbs: [
          { a: [222, 216], b: [262, 236], w: UA, far: true },
          { a: [262, 236], b: [306, 242], w: FA, far: true, end: "hand" },
          { a: [104, 220], b: [178, 242], w: TH },
          { a: [178, 243], b: [94, 245], w: SH },
          { a: [94, 245], b: [68, 247], w: FT, end: "foot" },
          { a: [104, 220], b: [208, 214], c: [152, 182], w: T },
          { a: [208, 214], b: [226, 226], w: NK },
          { a: [210, 216], b: [264, 240], w: UA, halo: true },
          { a: [264, 240], b: [312, 245], w: FA, halo: true, end: "hand" as const },
        ],
        props: [sideMat, { role: "prop", shape: { t: "ellipse", cx: 168, cy: 222, rx: 44, ry: 12 } }],
      },
    ],
  },
  butterfly: {
    frames: [
      {
        view: "front",
        head: { x: 200, y: 108, r: 17 },
        limbs: [
          { a: [186, 222], b: [118, 212], w: TH },
          { a: [214, 222], b: [282, 212], w: TH },
          { a: [118, 212], b: [194, 240], w: SH },
          { a: [282, 212], b: [206, 240], w: SH },
          { a: [200, 212], b: [200, 154], w: 48 },
          { a: [200, 146], b: [200, 126], w: NK + 1 },
          { a: [176, 154], b: [160, 192], w: UA, halo: true },
          { a: [160, 192], b: [188, 232], w: FA, halo: true, end: "hand" as const },
          { a: [224, 154], b: [240, 192], w: UA, halo: true },
          { a: [240, 192], b: [212, 232], w: FA, halo: true, end: "hand" as const },
        ],
        props: [
          sideMat,
          { role: "prop", shape: { t: "rect", x: 150, y: 228, w: 100, h: 22, r: 10 } },
          { role: "prop", shape: { t: "ellipse", cx: 114, cy: 234, rx: 24, ry: 13 } },
          { role: "prop", shape: { t: "ellipse", cx: 286, cy: 234, rx: 24, ry: 13 } },
        ],
      },
    ],
  },
  twist: {
    frames: [
      {
        view: "top",
        head: { x: 66, y: 150, r: 18 },
        limbs: [
          { a: [84, 150], b: [100, 150], w: NK + 2 },
          { a: [104, 150], b: [192, 150], w: 46 },
          { a: [112, 130], b: [112, 88], w: UA, halo: true },
          { a: [112, 88], b: [114, 50], w: FA, halo: true, end: "hand" as const },
          { a: [112, 170], b: [112, 212], w: UA, halo: true },
          { a: [112, 212], b: [114, 250], w: FA, halo: true, end: "hand" as const },
          { a: [196, 160], b: [252, 210], w: TH, far: true },
          { a: [252, 210], b: [200, 236], w: SH, far: true },
          { a: [196, 142], b: [262, 196], w: TH },
          { a: [262, 196], b: [208, 226], w: SH },
        ],
        props: [
          { role: "mat", shape: { t: "rect", x: 30, y: 34, w: 300, h: 232, r: 12 } },
          { role: "arrow", shape: { t: "path", d: "M 300 120 Q 316 160 296 196", arrow: true } },
        ],
      },
    ],
  },
  constructive: {
    frames: [
      {
        head: { x: 66, y: 224, r: 15 },
        limbs: [
          { a: [186, 238], b: [226, 184], w: TH, far: true },
          { a: [226, 184], b: [262, 240], w: SH, far: true },
          { a: [80, 230], b: [96, 235], w: NK },
          { a: [96, 237], b: [186, 238], w: T },
          { a: [186, 238], b: [234, 180], w: TH },
          { a: [234, 180], b: [274, 240], w: SH },
          { a: [274, 242], b: [294, 246], w: FT, end: "foot" },
          { a: [100, 232], b: [128, 244], w: UA, halo: true },
          { a: [128, 244], b: [160, 226], w: FA, halo: true, end: "hand" as const },
        ],
        props: [sideMat, { role: "prop", shape: { t: "rect", x: 40, y: 238, w: 54, h: 12, r: 6 } }],
      },
    ],
  },
  savasana: {
    frames: [
      {
        head: { x: 62, y: 228, r: 15 },
        limbs: [
          { a: [184, 238], b: [250, 224], w: TH, far: true },
          { a: [250, 224], b: [318, 238], w: SH, far: true },
          { a: [96, 236], b: [138, 242], w: UA, far: true },
          { a: [138, 242], b: [176, 244], w: FA, far: true, end: "hand" },
          { a: [77, 233], b: [92, 236], w: NK },
          { a: supineBase([184, 238]).S, b: [184, 238], w: T },
          { a: [184, 238], b: [254, 222], w: TH },
          { a: [254, 222], b: [322, 238], w: SH },
          { a: [322, 238], b: [332, 222], w: FT, end: "foot" },
          { a: [100, 240], b: [134, 246], w: UA, halo: true },
          { a: [134, 246], b: [172, 247], w: FA, halo: true, end: "hand" as const },
        ],
        props: [sideMat, { role: "prop", shape: { t: "ellipse", cx: 252, cy: 238, rx: 16, ry: 12 } }],
      },
    ],
  },
  needle: {
    frames: [
      {
        head: { x: 256, y: 234, r: 14 },
        limbs: [
          { a: [222, 232], b: [186, 244], w: UA, far: true },
          { a: [186, 244], b: [146, 246], w: FA, far: true, end: "hand" },
          { a: off([140, 168], -4, -2), b: off([140, 240], -4, -2), w: TH, far: true },
          { a: off([140, 240], -4, -2), b: off([80, 244], -4, -2), w: SH, far: true },
          { a: [140, 168], b: [226, 226], c: [182, 176], w: T },
          { a: [226, 226], b: [244, 232], w: NK },
          { a: [140, 168], b: [140, 240], w: TH },
          { a: [140, 240], b: [80, 244], w: SH },
          { a: [80, 244], b: [66, 246], w: FT, end: "foot" },
          { a: [214, 206], b: [252, 214], w: UA, halo: true },
          { a: [252, 214], b: [272, 244], w: FA, halo: true, end: "hand" as const },
        ],
        props: [sideMat, { role: "prop", shape: { t: "rect", x: 232, y: 240, w: 56, h: 10, r: 5 } }],
      },
    ],
  },
  hamstring: {
    frames: [
      {
        head: { x: 62, y: 226, r: 15 },
        limbs: [
          { a: [184, 238], b: [236, 190], w: TH, far: true },
          { a: [236, 190], b: [268, 242], w: SH, far: true },
          { a: [268, 243], b: [288, 246], w: FT, far: true, end: "foot" },
          { a: [77, 232], b: [92, 236], w: NK },
          { a: [96, 237], b: [184, 238], w: T },
          { a: [184, 238], b: [204, 176], w: TH },
          { a: [204, 176], b: [222, 116], w: SH },
          { a: [222, 116], b: [240, 110], w: FT, end: "foot" },
          { a: [100, 232], b: [126, 204], w: UA, halo: true },
          { a: [126, 204], b: [152, 186], w: FA, halo: true, end: "hand" as const },
        ],
        props: [
          sideMat,
          { role: "strap", shape: { t: "line", a: [152, 186], b: [230, 104], w: 3 } },
          { role: "strap", shape: { t: "line", a: [152, 186], b: [238, 118], w: 3 } },
        ],
      },
    ],
  },
  chair: {
    frames: [
      {
        head: { x: 62, y: 226, r: 15 },
        limbs: [
          { a: [77, 232], b: [92, 236], w: NK },
          { a: [96, 237], b: [176, 238], w: T },
          { a: [176, 238], b: [196, 178], w: TH },
          { a: [196, 178], b: [262, 178], w: SH },
          { a: [262, 178], b: [270, 162], w: FT, end: "foot" },
          { a: [100, 240], b: [132, 246], w: UA, halo: true },
          { a: [132, 246], b: [166, 247], w: FA, halo: true, end: "hand" as const },
        ],
        props: [
          sideMat,
          { role: "prop", shape: { t: "rect", x: 190, y: 186, w: 104, h: 9, r: 3 } },
          { role: "prop", shape: { t: "line", a: [198, 195], b: [198, 250], w: 5 } },
          { role: "prop", shape: { t: "line", a: [288, 195], b: [288, 250], w: 5 } },
          { role: "prop", shape: { t: "line", a: [290, 188], b: [296, 112], w: 5 } },
        ],
      },
    ],
  },
  kneeschest: {
    frames: [
      {
        head: { x: 64, y: 226, r: 15 },
        limbs: [
          { a: off([184, 238], 0, -2), b: off([164, 178], 6, 0), w: TH, far: true },
          { a: off([164, 178], 6, 0), b: off([214, 168], 6, 0), w: SH, far: true },
          { a: [79, 232], b: [94, 236], w: NK },
          { a: [96, 237], b: [184, 238], w: T },
          { a: [184, 238], b: [162, 178], w: TH },
          { a: [162, 178], b: [212, 168], w: SH },
          { a: [212, 168], b: [228, 174], w: FT, end: "foot" },
          { a: [100, 232], b: [130, 210], w: UA, halo: true },
          { a: [130, 210], b: [168, 190], w: FA, halo: true, end: "hand" as const },
        ],
        props: [sideMat],
      },
    ],
  },
};

/** Key alignment points, one list per frame. Labels are short and placed clear of the body. */
const NOTES: Record<string, Note[][]> = {
  seated: [[
    { p: [200, 140], t: [236, 100], text: "barki opuszczone" },
    { p: [170, 236], t: [36, 196], text: "biodra na poduszce" },
  ]],
  shoulders: [[{ p: [178, 132], t: [24, 100], text: "krąż barkami do tyłu" }]],
  catcow: [
    [{ p: [190, 196], t: [150, 128], text: "brzuch w dół" }],
    [{ p: [190, 140], t: [150, 108], text: "plecy w górę" }],
  ],
  child: [[
    { p: [108, 222], t: [24, 176], text: "biodra do pięt" },
    { p: [240, 246], t: [248, 200], text: "czoło oparte" },
  ]],
  butterfly: [[
    { p: [112, 226], t: [16, 176], text: "kolana podparte" },
    { p: [200, 241], t: [218, 270], text: "stopy razem" },
  ]],
  twist: [[
    { p: [236, 206], t: [258, 258], text: "kolana na bok" },
    { p: [112, 70], t: [130, 18], text: "barki na macie" },
  ]],
  constructive: [[
    { p: [282, 244], t: [272, 196], text: "stopy płasko" },
    { p: [140, 236], t: [40, 182], text: "plecy odpoczywają" },
  ]],
  savasana: [[
    { p: [252, 230], t: [226, 186], text: "wałek pod kolanami" },
    { p: [150, 246], t: [40, 196], text: "dłonie luźno" },
  ]],
  needle: [[
    { p: [140, 172], t: [24, 140], text: "biodra nad kolanami" },
    { p: [258, 236], t: [262, 190], text: "głowa oparta" },
  ]],
  hamstring: [[
    { p: [232, 112], t: [256, 86], text: "pasek za stopą" },
    { p: [262, 236], t: [278, 196], text: "kolano ugięte" },
  ]],
  chair: [[
    { p: [232, 182], t: [206, 136], text: "łydki na krześle" },
    { p: [174, 240], t: [24, 196], text: "biodra na podłodze" },
  ]],
  kneeschest: [[
    { p: [166, 186], t: [222, 140], text: "obejmij kolana" },
    { p: [70, 236], t: [24, 196], text: "głowa na macie" },
  ]],
};

for (const [id, frames] of Object.entries(NOTES)) frames.forEach((n, i) => {
  const f = FIGURES[id]?.frames[i];
  if (f) f.notes = n;
});
