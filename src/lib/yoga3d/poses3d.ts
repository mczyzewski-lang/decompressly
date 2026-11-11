import type { PoseSpec, V } from "./puppet";

/**
 * The catalogue poses for the 3D figure. Written as targets (see puppet.ts): where the pelvis, chest,
 * head, hands and feet are; x = forward, y = up, z = the figure's right (towards the default camera).
 * Lengths and floor contact are enforced when a pose is resolved, so values only need to be roughly right.
 */
const STAND: PoseSpec = {
  pelvis: [0, 0.97, 0],
  chest: [0, 1.47, 0],
  head: [0, 1.7, 0],
  bend: [0, 0, 0],
  shoulders: [0, 0, 1],
  hips: [0, 0, 1],
  handR: [0.02, 0.84, 0.27],
  handL: [0.02, 0.84, -0.27],
  footR: [0, 0.07, 0.1],
  footL: [0, 0.07, -0.1],
  elbowR: [-1, -0.2, 0.3],
  elbowL: [-1, -0.2, -0.3],
  kneeR: [1, 0.2, 0],
  kneeL: [1, 0.2, 0],
  toeR: [1, 0, 0],
  toeL: [1, 0, 0],
};

const P = (o: Partial<PoseSpec>): PoseSpec => ({ ...STAND, ...o });
/** both hands / both feet at the same place, mirrored left and right by `z` */
const both = (x: number, y: number, z: number): [V, V] => [
  [x, y, z],
  [x, y, -z],
];
const hands = (x: number, y: number, z: number) => {
  const [handR, handL] = both(x, y, z);
  return { handR, handL };
};
const feet = (x: number, y: number, z: number) => {
  const [footR, footL] = both(x, y, z);
  return { footR, footL };
};
const UP: V = [0, 1, 0];
const DOWN: V = [0, -1, 0];
const BACK: V = [-1, 0, 0];
/** lying on the back with the head towards −x */
const SUPINE = { pelvis: [0, 0.12, 0] as V, chest: [-0.5, 0.12, 0] as V, head: [-0.75, 0.13, 0] as V };
/** torso facing the camera (side-on stance along x): the right side is the back one */
const SIDE_ON = { shoulders: [-1, 0, 0] as V, hips: [-1, 0, 0] as V };

export const POSES_3D: Record<string, PoseSpec> = {
  /* ---------------- standing ---------------- */
  mountain: P({}),
  upwardsalute: P({ ...hands(0.02, 2.05, 0.07), elbowR: [0, 0, 1], elbowL: [0, 0, -1] }),
  forwardfold: P({ pelvis: [-0.12, 0.93, 0], chest: [0.18, 0.5, 0], head: [0.2, 0.25, 0], ...hands(0.22, 0.06, 0.13) }),
  halflift: P({ pelvis: [-0.15, 0.95, 0], chest: [0.33, 1.0, 0], head: [0.6, 1.04, 0], ...hands(0.14, 0.5, 0.12), elbowR: [0, 0, 1], elbowL: [0, 0, -1] }),
  chairpose: P({ pelvis: [-0.28, 0.68, 0], chest: [-0.08, 1.13, 0], head: [0.02, 1.34, 0], ...hands(0.42, 1.6, 0.14) }),
  warrior1: P({ pelvis: [0, 0.72, 0], chest: [0.02, 1.22, 0], head: [0.02, 1.45, 0], footR: [0.55, 0.07, 0.1], footL: [-0.75, 0.07, -0.1], toeL: [0.6, 0, -0.8], ...hands(0.05, 1.85, 0.09) }),
  warrior2: P({ ...SIDE_ON, pelvis: [0, 0.7, 0], chest: [0, 1.2, 0], head: [0.03, 1.43, 0], footL: [0.6, 0.07, 0], footR: [-0.75, 0.07, 0], toeR: [0, 0, 1], kneeL: [1, 0.3, 0], kneeR: [0, 0, 1], handL: [0.8, 1.2, 0], handR: [-0.8, 1.2, 0] }),
  reversewarrior: P({ ...SIDE_ON, pelvis: [0, 0.7, 0], chest: [-0.16, 1.17, 0], head: [-0.22, 1.4, 0], footL: [0.6, 0.07, 0], footR: [-0.75, 0.07, 0], toeR: [0, 0, 1], kneeL: [1, 0.3, 0], kneeR: [0, 0, 1], handL: [-0.25, 1.85, 0], handR: [-0.5, 0.55, 0.05], elbowR: [0, 0, 1] }),
  triangle: P({ hips: [-1, 0, 0], shoulders: [0, 1, 0], pelvis: [-0.05, 0.82, 0], chest: [0.42, 0.96, 0], head: [0.66, 1.0, 0], footL: [0.6, 0.07, 0], footR: [-0.65, 0.07, 0], toeR: [0, 0, 1], kneeL: [0, 0, 1], kneeR: [0, 0, 1], handL: [0.6, 0.3, 0], handR: [0.42, 1.65, 0] }),
  sideangle: P({ hips: [-1, 0, 0], shoulders: [-0.4, 0.9, 0], pelvis: [0.05, 0.66, 0], chest: [0.46, 0.94, 0], head: [0.68, 1.06, 0], footL: [0.62, 0.07, 0], footR: [-0.8, 0.07, 0], toeR: [0, 0, 1], kneeL: [1, 0.4, 0], kneeR: [0, 0, 1], handL: [0.62, 0.6, 0.12], elbowL: [1, 0, 0.3], handR: [1.0, 1.42, 0] }),
  highlunge: P({ pelvis: [0, 0.7, 0], chest: [0.01, 1.2, 0], head: [0.01, 1.43, 0], footR: [0.55, 0.07, 0.1], footL: [-0.76, 0.12, -0.1], toeL: [0.45, -0.9, 0], ...hands(0.04, 1.85, 0.09) }),
  pyramid: P({ pelvis: [-0.05, 0.9, 0], chest: [0.33, 0.56, 0], head: [0.42, 0.34, 0], footR: [0.4, 0.07, 0.1], footL: [-0.45, 0.07, -0.1], ...hands(0.45, 0.06, 0.16) }),
  widefold: P({ pelvis: [-0.12, 0.8, 0], chest: [0.16, 0.4, 0], head: [0.2, 0.17, 0], ...feet(0, 0.07, 0.55), ...hands(0.28, 0.05, 0.2), kneeR: [1, 0, 0.3], kneeL: [1, 0, -0.3] }),
  goddess: P({ pelvis: [0, 0.6, 0], chest: [0, 1.1, 0], head: [0, 1.33, 0], ...feet(0, 0.07, 0.5), toeR: [0.4, 0, 1], toeL: [0.4, 0, -1], kneeR: [0.4, 0.3, 1], kneeL: [0.4, 0.3, -1], ...hands(0.02, 1.45, 0.43), elbowR: [0, -0.4, 1], elbowL: [0, -0.4, -1] }),
  malasana: P({ pelvis: [-0.16, 0.28, 0], chest: [-0.02, 0.76, 0], head: [0.02, 0.99, 0], ...feet(0, 0.07, 0.2), toeR: [0.8, 0, 0.6], toeL: [0.8, 0, -0.6], kneeR: [1, 0.6, 0.8], kneeL: [1, 0.6, -0.8], ...hands(0.2, 0.62, 0.03), elbowR: [0.3, -0.3, 1], elbowL: [0.3, -0.3, -1] }),

  /* ---------------- balance ---------------- */
  tree: P({ footL: [0.02, 0.62, 0.0], kneeL: [0.2, 0, -1], toeL: [0, -1, 0.1], ...hands(0.16, 1.28, 0.03), elbowR: [0, -0.3, 1], elbowL: [0, -0.3, -1] }),
  eagle: P({ pelvis: [-0.12, 0.78, 0], chest: [-0.02, 1.27, 0], head: [0.0, 1.5, 0], footR: [0, 0.07, 0.03], footL: [0.08, 0.28, 0.14], kneeL: [1, 0.2, 0.3], toeL: [0.3, -0.9, 0.2], ...hands(0.3, 1.45, 0.03), elbowR: [1, -0.6, 0.1], elbowL: [1, -0.6, -0.1] }),
  warrior3: P({ pelvis: [0, 0.95, 0], chest: [0.5, 0.98, 0], head: [0.74, 1.02, 0], ...hands(1.05, 1.0, 0.12), footR: [0, 0.07, 0.1], footL: [-0.9, 0.97, -0.1], toeL: [0, -1, 0], kneeL: [0, -1, 0] }),
  halfmoon: P({ hips: [-0.25, 0.95, 0], shoulders: [0, 1, 0], pelvis: [0, 0.95, 0], chest: [0.5, 0.95, 0], head: [0.74, 0.98, 0], footL: [0, 0.07, 0], kneeL: [1, 0, 0], footR: [-0.9, 1.05, 0], toeR: [0, 0, 1], kneeR: [0, 0, 1], handL: [0.5, 0.06, 0], handR: [0.5, 1.62, 0] }),
  dancer: P({ pelvis: [0, 0.94, 0], chest: [0.26, 1.36, 0], head: [0.4, 1.55, 0], footR: [0, 0.07, 0.1], footL: [-0.55, 1.16, -0.1], kneeL: [-0.5, -0.8, 0], toeL: [-0.3, 0.9, 0], handL: [-0.5, 1.12, -0.13], elbowL: [-1, 0.3, -0.4], handR: [0.78, 1.5, 0.1] }),

  /* ---------------- all fours and planks ---------------- */
  cat: P({ pelvis: [-0.35, 0.55, 0], chest: [0.3, 0.55, 0], bend: [0, 0.13, 0], head: [0.48, 0.38, 0], ...hands(0.35, 0.04, 0.18), ...feet(-0.85, 0.06, 0.1), kneeR: [0.3, -1, 0], kneeL: [0.3, -1, 0], toeR: BACK, toeL: BACK }),
  cow: P({ pelvis: [-0.35, 0.57, 0], chest: [0.3, 0.57, 0], bend: [0, -0.09, 0], head: [0.5, 0.76, 0], ...hands(0.35, 0.04, 0.18), ...feet(-0.85, 0.06, 0.1), kneeR: [0.3, -1, 0], kneeL: [0.3, -1, 0], toeR: BACK, toeL: BACK }),
  needle: P({ pelvis: [-0.35, 0.55, 0], chest: [0.14, 0.2, 0], head: [0.3, 0.1, 0.06], shoulders: [0, -0.5, 0.85], ...feet(-0.85, 0.06, 0.1), kneeR: [0.3, -1, 0], kneeL: [0.3, -1, 0], toeR: BACK, toeL: BACK, handR: [0.2, 0.04, -0.5], elbowR: [0, -1, -0.3], handL: [0.62, 0.04, -0.16] }),
  child: P({ pelvis: [-0.45, 0.27, 0], chest: [0.02, 0.2, 0], head: [0.22, 0.1, 0], ...feet(-0.42, 0.05, 0.1), kneeR: [1, 0, 0.15], kneeL: [1, 0, -0.15], toeR: BACK, toeL: BACK, ...hands(0.72, 0.04, 0.15) }),
  puppy: P({ pelvis: [-0.35, 0.55, 0], chest: [0.1, 0.2, 0], head: [0.3, 0.1, 0], ...feet(-0.85, 0.06, 0.1), kneeR: [0.3, -1, 0], kneeL: [0.3, -1, 0], toeR: BACK, toeL: BACK, ...hands(0.82, 0.04, 0.15) }),
  downdog: P({ pelvis: [-0.07, 0.78, 0], chest: [0.3, 0.44, 0], head: [0.4, 0.25, 0], ...hands(0.76, 0.04, 0.16), ...feet(-0.65, 0.07, 0.1) }),
  dolphin: P({ pelvis: [-0.1, 0.8, 0], chest: [0.3, 0.38, 0], head: [0.42, 0.17, 0], ...hands(0.72, 0.04, 0.08), elbowR: [0, -1, 0.2], elbowL: [0, -1, -0.2], ...feet(-0.55, 0.07, 0.1) }),
  plank: P({ pelvis: [-0.04, 0.45, 0], chest: [0.44, 0.58, 0], head: [0.68, 0.63, 0], ...hands(0.45, 0.04, 0.18), ...feet(-0.92, 0.08, 0.1), toeR: [0.5, -0.85, 0], toeL: [0.5, -0.85, 0], kneeR: DOWN, kneeL: DOWN }),
  chaturanga: P({ pelvis: [-0.06, 0.22, 0], chest: [0.44, 0.22, 0], head: [0.66, 0.27, 0], ...hands(0.3, 0.04, 0.22), elbowR: [-1, 0.5, 0.1], elbowL: [-1, 0.5, -0.1], ...feet(-0.95, 0.08, 0.1), toeR: [0.5, -0.85, 0], toeL: [0.5, -0.85, 0], kneeR: DOWN, kneeL: DOWN }),
  sideplank: P({ shoulders: [0, -1, 0], hips: [0, -1, 0], pelvis: [0.15, 0.42, 0], chest: [-0.3, 0.66, 0], head: [-0.5, 0.78, 0], handR: [-0.32, 0.04, 0], handL: [-0.3, 1.35, 0], footR: [0.92, 0.06, 0], footL: [0.92, 0.2, 0], toeR: [0.6, 0, 0.8], toeL: [0.6, 0, 0.8], kneeR: [0, 0, 1], kneeL: [0, 0, 1] }),
  reverseplank: P({ pelvis: [0, 0.45, 0], chest: [-0.46, 0.6, 0], head: [-0.66, 0.7, 0], ...hands(-0.5, 0.04, 0.18), elbowR: [-1, 0, 0.2], elbowL: [-1, 0, -0.2], ...feet(0.88, 0.06, 0.08), toeR: [1, -0.25, 0], toeL: [1, -0.25, 0], kneeR: UP, kneeL: UP }),

  /* ---------------- backbends ---------------- */
  lowlunge: P({ pelvis: [0, 0.45, 0], chest: [0.05, 0.95, 0], head: [0.03, 1.18, 0], footR: [0.5, 0.07, 0.1], footL: [-0.86, 0.07, -0.1], kneeL: DOWN, toeL: BACK, ...hands(0.1, 1.6, 0.09) }),
  cobra: P({ pelvis: [-0.2, 0.12, 0], chest: [0.15, 0.44, 0], bend: [0.04, -0.03, 0], head: [0.2, 0.68, 0], ...hands(0.22, 0.04, 0.2), elbowR: [-1, 0.4, 0.2], elbowL: [-1, 0.4, -0.2], ...feet(-1.1, 0.05, 0.1), toeR: BACK, toeL: BACK, kneeR: DOWN, kneeL: DOWN }),
  sphinx: P({ pelvis: [-0.2, 0.12, 0], chest: [0.19, 0.38, 0], bend: [0.03, -0.02, 0], head: [0.27, 0.6, 0], ...hands(0.5, 0.04, 0.18), elbowR: [0, -1, 0], elbowL: [0, -1, 0], ...feet(-1.1, 0.05, 0.1), toeR: BACK, toeL: BACK, kneeR: DOWN, kneeL: DOWN }),
  updog: P({ pelvis: [-0.26, 0.22, 0], chest: [0, 0.64, 0], bend: [0.05, -0.03, 0], head: [0.0, 0.88, 0], ...hands(0.16, 0.04, 0.18), ...feet(-1.15, 0.06, 0.1), toeR: BACK, toeL: BACK, kneeR: DOWN, kneeL: DOWN }),
  locust: P({ pelvis: [0, 0.12, 0], chest: [0.42, 0.32, 0], head: [0.62, 0.46, 0], ...hands(-0.12, 0.34, 0.22), ...feet(-0.9, 0.34, 0.1), toeR: BACK, toeL: BACK, kneeR: DOWN, kneeL: DOWN }),
  bow: P({ pelvis: [0, 0.14, 0], chest: [0.3, 0.46, 0], bend: [0.05, -0.04, 0], head: [0.4, 0.68, 0], ...feet(-0.42, 0.72, 0.1), kneeR: [-1, -0.4, 0.2], kneeL: [-1, -0.4, -0.2], toeR: [-0.3, 0.9, 0], toeL: [-0.3, 0.9, 0], ...hands(-0.38, 0.7, 0.13), elbowR: [-1, 0.5, 0.3], elbowL: [-1, 0.5, -0.3] }),
  camel: P({ pelvis: [0, 0.55, 0], chest: [-0.2, 1.0, 0], bend: [0.1, 0, 0], head: [-0.38, 1.14, 0], ...feet(-0.48, 0.06, 0.1), kneeR: [0.5, -1, 0], kneeL: [0.5, -1, 0], toeR: BACK, toeL: BACK, ...hands(-0.45, 0.16, 0.12) }),
  bridge: P({ pelvis: [-0.05, 0.5, 0], chest: [-0.5, 0.14, 0], head: [-0.75, 0.1, 0], ...feet(0.4, 0.07, 0.1), kneeR: UP, kneeL: UP, ...hands(-0.06, 0.04, 0.2) }),

  /* ---------------- seated ---------------- */
  seated: P({ pelvis: [0, 0.13, 0], chest: [0, 0.63, 0], head: [0, 0.86, 0], footR: [0.3, 0.06, -0.12], footL: [0.3, 0.06, 0.12], kneeR: [0.3, 0, 1], kneeL: [0.3, 0, -1], toeR: [0.3, 0, -1], toeL: [0.3, 0, 1], ...hands(0.3, 0.26, 0.3) }),
  staff: P({ pelvis: [0, 0.12, 0], chest: [0, 0.62, 0], head: [0, 0.85, 0], ...feet(0.9, 0.07, 0.08), toeR: UP, toeL: UP, kneeR: UP, kneeL: UP, ...hands(0.06, 0.04, 0.22) }),
  seatedfold: P({ pelvis: [0, 0.12, 0], chest: [0.42, 0.34, 0], head: [0.62, 0.32, 0], ...feet(0.9, 0.07, 0.08), toeR: UP, toeL: UP, kneeR: UP, kneeL: UP, ...hands(0.86, 0.16, 0.1), elbowR: [0, -0.3, 1], elbowL: [0, -0.3, -1] }),
  headtoknee: P({ pelvis: [0, 0.12, 0], chest: [0.4, 0.36, 0.04], head: [0.6, 0.34, 0.06], footR: [0.9, 0.07, 0.1], toeR: UP, kneeR: UP, footL: [0.2, 0.06, 0.02], kneeL: [0.2, 0, -1], toeL: [1, 0, 0.3], ...hands(0.86, 0.16, 0.1), handL: [0.86, 0.16, 0.06], elbowR: [0, -0.3, 1], elbowL: [0, -0.3, -1] }),
  butterfly: P({ pelvis: [0, 0.13, 0], chest: [0, 0.63, 0], head: [0, 0.86, 0], ...feet(0.36, 0.06, 0.03), kneeR: [0.3, 0.1, 1], kneeL: [0.3, 0.1, -1], toeR: [1, 0, -0.2], toeL: [1, 0, 0.2], ...hands(0.36, 0.13, 0.06) }),
  boat: P({ pelvis: [0, 0.13, 0], chest: [-0.26, 0.56, 0], head: [-0.34, 0.78, 0], ...feet(0.72, 0.78, 0.08), toeR: [0.7, 0.7, 0], toeL: [0.7, 0.7, 0], kneeR: UP, kneeL: UP, ...hands(0.42, 0.62, 0.16) }),
  seatedtwist: P({ pelvis: [0, 0.13, 0], chest: [0, 0.63, 0], head: [0, 0.86, 0], shoulders: [-0.75, 0, 0.65], footR: [0.22, 0.07, -0.14], kneeR: [0.2, 1, 0], footL: [0.9, 0.07, -0.06], toeL: UP, kneeL: UP, handR: [-0.32, 0.04, 0.1], handL: [0.24, 0.42, -0.02], elbowL: [0.5, -0.3, 1] }),
  pigeon: P({ pelvis: [0, 0.2, 0], chest: [0.06, 0.7, 0], head: [0.08, 0.93, 0], footR: [0.26, 0.06, -0.16], kneeR: [1, 0, 0.6], toeR: [0, 0, -1], footL: [-0.9, 0.05, -0.1], toeL: BACK, kneeL: DOWN, ...hands(0.26, 0.04, 0.3) }),
  lizard: P({ pelvis: [-0.06, 0.38, 0], chest: [0.4, 0.56, 0], head: [0.62, 0.62, 0], footR: [0.45, 0.07, 0.26], kneeR: [1, 0.6, 0.3], footL: [-0.9, 0.08, -0.1], kneeL: DOWN, toeL: BACK, handR: [0.46, 0.04, 0.02], handL: [0.46, 0.04, -0.2] }),
  halfsplit: P({ pelvis: [-0.3, 0.5, 0], chest: [0.1, 0.74, 0], head: [0.3, 0.8, 0], footL: [-0.8, 0.06, -0.1], kneeL: [0.3, -1, 0], toeL: BACK, footR: [0.56, 0.07, 0.1], toeR: [0.3, 1, 0], kneeR: UP, ...hands(0.16, 0.04, 0.2) }),

  /* ---------------- lying down ---------------- */
  kneeschest: P({ ...SUPINE, ...feet(0.1, 0.5, 0.08), kneeR: [-1, 0.6, 0.1], kneeL: [-1, 0.6, -0.1], toeR: [0.9, 0.3, 0], toeL: [0.9, 0.3, 0], ...hands(-0.16, 0.46, 0.12), elbowR: [0, 0, 1], elbowL: [0, 0, -1] }),
  happybaby: P({ ...SUPINE, ...feet(-0.16, 0.56, 0.32), kneeR: [-0.7, -0.5, 1], kneeL: [-0.7, -0.5, -1], toeR: [0.5, 0.85, 0], toeL: [0.5, 0.85, 0], ...hands(-0.16, 0.56, 0.3), elbowR: [0, 0, 1], elbowL: [0, 0, -1] }),
  twist: P({ ...SUPINE, footR: [0.26, 0.08, 0.46], footL: [0.26, 0.17, 0.5], kneeR: [0.4, 0.2, 1], kneeL: [0.4, 0.3, 1], toeR: [1, 0, 0.3], toeL: [1, 0, 0.3], handR: [-0.5, 0.04, 0.75], handL: [-0.5, 0.04, -0.75] }),
  legsupwall: P({ ...SUPINE, ...feet(0.1, 1.04, 0.08), toeR: [-0.6, 0.8, 0], toeL: [-0.6, 0.8, 0], kneeR: [1, 0, 0], kneeL: [1, 0, 0], ...hands(-0.3, 0.04, 0.42) }),
  savasana: P({ ...SUPINE, ...feet(0.9, 0.06, 0.2), toeR: [0.3, 0.7, 0.6], toeL: [0.3, 0.7, -0.6], kneeR: UP, kneeL: UP, ...hands(-0.1, 0.04, 0.42) }),
};

/** Which 3D frames show a catalogue pose (two frames = a flowing pose that moves between them). */
export function framesFor(poseId: string): PoseSpec[] {
  if (poseId === "catcow") return [POSES_3D.cat, POSES_3D.cow];
  const p = POSES_3D[poseId];
  return p ? [p] : [POSES_3D.mountain];
}
