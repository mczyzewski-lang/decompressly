/**
 * A point-based figure for the 3D yoga view. A pose says where the pelvis, chest, head, hands and feet
 * are; elbows and knees follow from two-bone inverse kinematics, so limbs always keep their length and
 * blending two poses gives a natural movement between them. Pure math — no rendering here.
 *
 * Axes: x = forward (the figure faces +x by default), y = up, z = the figure's right. The default
 * camera stands on the +z side, so the figure is seen from its right, facing right.
 */
export type V = [number, number, number];

export const BODY = {
  thigh: 0.45,
  shin: 0.45,
  ankle: 0.07,
  torso: 0.5,
  neck: 0.22, // neck base → centre of the head
  upperArm: 0.3,
  forearm: 0.27,
  shoulder: 0.19, // half width
  hip: 0.1, // half width
  foot: 0.2,
};

/** What a pose is written as. Everything is a target: lengths are enforced when the pose is resolved. */
export interface PoseSpec {
  pelvis: V;
  chest: V;
  head: V;
  /** offset of the middle of the spine (arched or rounded back) */
  bend: V;
  /** direction from the centre to the right shoulder / right hip */
  shoulders: V;
  hips: V;
  handR: V;
  handL: V;
  footR: V; // ankle
  footL: V;
  /** which way elbows and knees point */
  elbowR: V;
  elbowL: V;
  kneeR: V;
  kneeL: V;
  /** direction of each foot, from ankle to toes */
  toeR: V;
  toeL: V;
}

export const SPEC_KEYS = ["pelvis", "chest", "head", "bend", "shoulders", "hips", "handR", "handL", "footR", "footL", "elbowR", "elbowL", "kneeR", "kneeL", "toeR", "toeL"] as const;

export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V, fallback: V = [0, 1, 0]): V => {
  const l = len(a);
  return l < 1e-6 ? fallback : mul(a, 1 / l);
};
export const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Blend of two poses (targets are blended; the result is resolved like any other pose). */
export function blend(a: PoseSpec, b: PoseSpec, t: number): PoseSpec {
  const out = {} as PoseSpec;
  for (const k of SPEC_KEYS) out[k] = lerp(a[k], b[k], t);
  return out;
}

/** The same pose on the other side: left and right swapped, mirrored across the figure's middle. */
export function mirror(p: PoseSpec): PoseSpec {
  const m = (v: V): V => [v[0], v[1], -v[2]];
  const neg = (v: V): V => [-v[0], -v[1], -v[2]];
  return {
    pelvis: m(p.pelvis),
    chest: m(p.chest),
    head: m(p.head),
    bend: m(p.bend),
    shoulders: neg(m(p.shoulders)),
    hips: neg(m(p.hips)),
    handR: m(p.handL),
    handL: m(p.handR),
    footR: m(p.footL),
    footL: m(p.footR),
    elbowR: m(p.elbowL),
    elbowL: m(p.elbowR),
    kneeR: m(p.kneeL),
    kneeL: m(p.kneeR),
    toeR: m(p.toeL),
    toeL: m(p.toeR),
  };
}

/** Two-bone IK: the middle joint and the reachable end for a limb from `root` towards `target`. */
export function ik(root: V, target: V, l1: number, l2: number, pole: V): { mid: V; end: V } {
  const to = sub(target, root);
  const d = Math.min(l1 + l2 - 1e-4, Math.max(Math.abs(l1 - l2) + 1e-4, len(to)));
  const dir = norm(to, [0, -1, 0]);
  const end = add(root, mul(dir, d));
  const a = (l1 * l1 + d * d - l2 * l2) / (2 * d); // distance along the line to the foot of the joint
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // the part of the pole direction that is square to the limb line
  let side = sub(pole, mul(dir, dot(pole, dir)));
  if (len(side) < 1e-4) side = cross(dir, [0, 0, 1]);
  if (len(side) < 1e-4) side = cross(dir, [1, 0, 0]);
  return { mid: add(add(root, mul(dir, a)), mul(norm(side), h)), end };
}

export interface Skeleton {
  pelvis: V;
  mid: V;
  chest: V;
  head: V;
  /** which way the chest faces */
  front: V;
  shR: V;
  shL: V;
  elR: V;
  elL: V;
  haR: V;
  haL: V;
  hipR: V;
  hipL: V;
  knR: V;
  knL: V;
  anR: V;
  anL: V;
  toR: V;
  toL: V;
}

/** Joint positions of a pose, with limb lengths enforced and the figure standing on the floor (y = 0). */
export function resolve(p: PoseSpec): Skeleton {
  const spine = norm(sub(p.chest, p.pelvis));
  const chest = add(p.pelvis, mul(spine, BODY.torso));
  const mid = add(lerp(p.pelvis, chest, 0.5), p.bend);
  const head = add(chest, mul(norm(sub(p.head, p.chest), spine), BODY.neck));
  const sAxis = norm(p.shoulders, [0, 0, 1]);
  const hAxis = norm(p.hips, [0, 0, 1]);
  const shR = add(chest, mul(sAxis, BODY.shoulder));
  const shL = add(chest, mul(sAxis, -BODY.shoulder));
  const hipR = add(p.pelvis, mul(hAxis, BODY.hip));
  const hipL = add(p.pelvis, mul(hAxis, -BODY.hip));
  const armR = ik(shR, p.handR, BODY.upperArm, BODY.forearm, p.elbowR);
  const armL = ik(shL, p.handL, BODY.upperArm, BODY.forearm, p.elbowL);
  const legR = ik(hipR, p.footR, BODY.thigh, BODY.shin, p.kneeR);
  const legL = ik(hipL, p.footL, BODY.thigh, BODY.shin, p.kneeL);
  const s: Skeleton = {
    pelvis: p.pelvis,
    mid,
    chest,
    head,
    front: norm(cross(spine, sAxis), [1, 0, 0]),
    shR,
    shL,
    elR: armR.mid,
    elL: armL.mid,
    haR: armR.end,
    haL: armL.end,
    hipR,
    hipL,
    knR: legR.mid,
    knL: legL.mid,
    anR: legR.end,
    anL: legL.end,
    toR: add(legR.end, mul(norm(p.toeR, [1, 0, 0]), BODY.foot)),
    toL: add(legL.end, mul(norm(p.toeL, [1, 0, 0]), BODY.foot)),
  };
  // stand the figure on the floor: the lowest body part (with its thickness) touches y = 0
  const low = Math.min(
    s.pelvis[1] - 0.13,
    s.chest[1] - 0.13,
    s.mid[1] - 0.12,
    s.head[1] - 0.105,
    s.elR[1] - 0.045,
    s.elL[1] - 0.045,
    s.haR[1] - 0.04,
    s.haL[1] - 0.04,
    s.knR[1] - 0.06,
    s.knL[1] - 0.06,
    s.anR[1] - 0.05,
    s.anL[1] - 0.05,
    s.toR[1] - 0.035,
    s.toL[1] - 0.035,
  );
  if (Math.abs(low) > 1e-4) for (const k of Object.keys(s) as (keyof Skeleton)[]) if (k !== "front") s[k] = [s[k][0], s[k][1] - low, s[k][2]];
  return s;
}
