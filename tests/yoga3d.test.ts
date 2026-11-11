import { describe, expect, it } from "vitest";
import { POSES } from "@/lib/yoga/poses";
import { POSES_3D, framesFor } from "@/lib/yoga3d/poses3d";
import { BODY, blend, len, mirror, resolve, sub, type Skeleton } from "@/lib/yoga3d/puppet";
import { FRAGMENT, SCENES, nextScene, type SceneChoice } from "@/lib/scenes";

const limbs = (s: Skeleton) => [
  [len(sub(s.elR, s.shR)), BODY.upperArm],
  [len(sub(s.haR, s.elR)), BODY.forearm],
  [len(sub(s.elL, s.shL)), BODY.upperArm],
  [len(sub(s.haL, s.elL)), BODY.forearm],
  [len(sub(s.knR, s.hipR)), BODY.thigh],
  [len(sub(s.anR, s.knR)), BODY.shin],
  [len(sub(s.knL, s.hipL)), BODY.thigh],
  [len(sub(s.anL, s.knL)), BODY.shin],
  [len(sub(s.chest, s.pelvis)), BODY.torso],
];
const lowest = (s: Skeleton) => Math.min(...(Object.keys(s) as (keyof Skeleton)[]).filter((k) => k !== "front").map((k) => s[k][1]));

describe("3D yoga figure", () => {
  it("has a 3D pose for every pose of the catalogue", () => {
    for (const p of POSES) expect(framesFor(p.id).length, p.id).toBeGreaterThan(0);
  });

  it("keeps limb lengths and stands on the floor in every pose, and half-way between poses", () => {
    const specs = Object.values(POSES_3D);
    const all = [...specs, ...specs.slice(1).map((p, i) => blend(specs[i], p, 0.5))];
    for (const spec of all) {
      const s = resolve(spec);
      for (const [got, want] of limbs(s)) expect(got).toBeCloseTo(want, 3);
      const low = lowest(s);
      expect(low).toBeGreaterThan(-0.001);
      expect(low).toBeLessThan(0.14);
    }
  });

  it("mirrors a pose to the other side, and back", () => {
    const p = POSES_3D.warrior2;
    const a = resolve(p);
    const b = resolve(mirror(p));
    expect(b.haR[2]).toBeCloseTo(-a.haL[2], 5);
    expect(b.anL[0]).toBeCloseTo(a.anR[0], 5);
    expect(resolve(mirror(mirror(p))).haR).toEqual(a.haR);
  });
});

describe("places", () => {
  it("cycles through every place and ends without a background", () => {
    let v: SceneChoice = "beach";
    const seen: SceneChoice[] = [];
    for (let i = 0; i < SCENES.length + 1; i++) seen.push((v = nextScene(v)));
    expect(new Set(seen).size).toBe(SCENES.length + 1);
    expect(seen).toContain("none");
  });
  it("has a shader and a fallback for every place", () => {
    for (const s of SCENES) {
      expect(FRAGMENT[s.id]).toContain("void main");
      expect(s.fallback).toContain("gradient");
    }
  });
});
