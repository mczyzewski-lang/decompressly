"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";
import { blend, mirror as mirrorSpec, resolve, type PoseSpec, type Skeleton, type V } from "@/lib/yoga3d/puppet";
import { framesFor } from "@/lib/yoga3d/poses3d";
import { cn } from "./ui";

export type YogaPlace = "studio" | "lawn";

type T = typeof THREE_NS;

const SKIN = 0xd9a985;
const SHIRT = 0xb8b8b3;
const SHORTS = 0x2f3b5e;
const HAIR = 0x3b2a20;

/** A figure made of tapered cylinders and spheres, placed every frame from the resolved joints. */
function createFigure(THREE: T) {
  const group = new THREE.Group();
  const mat = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0 });
  const skin = mat(SKIN);
  const shirt = mat(SHIRT);
  const shorts = mat(SHORTS);
  const hair = mat(HAIR);
  const sphereGeo = new THREE.SphereGeometry(1, 24, 18);
  const Y = new THREE.Vector3(0, 1, 0);
  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const m4 = new THREE.Matrix4();

  const meshes: THREE_NS.Mesh[] = [];
  const add = (m: THREE_NS.Mesh) => {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    meshes.push(m);
    return m;
  };
  /** cylinder from a to b; `part` = which stretch of the segment it covers (for sleeves and shorts) */
  const limb = (rA: number, rB: number, material: THREE_NS.Material, part: [number, number] = [0, 1]) => {
    const mesh = add(new THREE.Mesh(new THREE.CylinderGeometry(rB, rA, 1, 18, 1), material));
    return (a: V, b: V) => {
      va.set(a[0], a[1], a[2]);
      vb.set(b[0], b[1], b[2]);
      dir.subVectors(vb, va);
      const full = dir.length() || 1e-4;
      dir.normalize();
      const from = full * part[0];
      const length = full * (part[1] - part[0]);
      mesh.position.copy(va).addScaledVector(dir, from + length / 2);
      mesh.quaternion.setFromUnitVectors(Y, dir);
      mesh.scale.set(1, length, 1);
    };
  };
  const ball = (r: number, material: THREE_NS.Material, squash: [number, number, number] = [1, 1, 1]) => {
    const mesh = add(new THREE.Mesh(sphereGeo, material));
    mesh.scale.set(r * squash[0], r * squash[1], r * squash[2]);
    return (p: V) => void mesh.position.set(p[0], p[1], p[2]);
  };
  /** torso piece: wider than deep, turned so its width follows the shoulders */
  const trunk = (rA: number, rB: number, material: THREE_NS.Material) => {
    const mesh = add(new THREE.Mesh(new THREE.CylinderGeometry(rB, rA, 1, 20, 1), material));
    return (a: V, b: V, side: V) => {
      va.set(a[0], a[1], a[2]);
      vb.set(b[0], b[1], b[2]);
      dir.subVectors(vb, va);
      const length = dir.length() || 1e-4;
      dir.normalize();
      tmp.set(side[0], side[1], side[2]).addScaledVector(dir, -tmp.set(side[0], side[1], side[2]).dot(dir));
      if (tmp.lengthSq() < 1e-6) tmp.set(0, 0, 1);
      tmp.normalize();
      const front = new THREE.Vector3().crossVectors(dir, tmp);
      m4.makeBasis(front, dir, tmp);
      mesh.quaternion.setFromRotationMatrix(m4);
      mesh.position.copy(va).addScaledVector(dir, length / 2);
      mesh.scale.set(0.78, length, 1.12);
    };
  };

  const parts = {
    lower: trunk(0.125, 0.132, shirt),
    upper: trunk(0.132, 0.148, shirt),
    waist: ball(0.104, shorts),
    belly: ball(0.102, shirt),
    collar: limb(0.066, 0.066, shirt),
    shR: ball(0.07, shirt),
    shL: ball(0.07, shirt),
    neck: limb(0.047, 0.045, skin, [0, 0.62]),
    head: ball(0.105, skin, [0.95, 1.1, 0.92]),
    hair: ball(0.104, hair, [0.98, 1.05, 0.96]),
    armR: limb(0.05, 0.042, skin),
    armL: limb(0.05, 0.042, skin),
    sleeveR: limb(0.058, 0.054, shirt, [0, 0.45]),
    sleeveL: limb(0.058, 0.054, shirt, [0, 0.45]),
    elR: ball(0.043, skin),
    elL: ball(0.043, skin),
    foreR: limb(0.041, 0.033, skin),
    foreL: limb(0.041, 0.033, skin),
    haR: ball(0.043, skin, [0.8, 1.1, 1]),
    haL: ball(0.043, skin, [0.8, 1.1, 1]),
    hipR: ball(0.09, shorts),
    hipL: ball(0.09, shorts),
    thighR: limb(0.078, 0.058, skin),
    thighL: limb(0.078, 0.058, skin),
    shortR: limb(0.09, 0.076, shorts, [0, 0.52]),
    shortL: limb(0.09, 0.076, shorts, [0, 0.52]),
    knR: ball(0.059, skin),
    knL: ball(0.059, skin),
    shinR: limb(0.056, 0.04, skin),
    shinL: limb(0.056, 0.04, skin),
    anR: ball(0.043, skin),
    anL: ball(0.043, skin),
    footR: limb(0.042, 0.034, skin),
    footL: limb(0.042, 0.034, skin),
    toR: ball(0.035, skin),
    toL: ball(0.035, skin),
  };

  const setSkeleton = (s: Skeleton) => {
    const side: V = [s.shR[0] - s.shL[0], s.shR[1] - s.shL[1], s.shR[2] - s.shL[2]];
    const hipSide: V = [s.hipR[0] - s.hipL[0], s.hipR[1] - s.hipL[1], s.hipR[2] - s.hipL[2]];
    parts.lower(s.pelvis, s.mid, hipSide);
    parts.upper(s.mid, s.chest, side);
    parts.waist(s.pelvis);
    parts.belly(s.mid);
    parts.collar(s.shL, s.shR);
    parts.shR(s.shR);
    parts.shL(s.shL);
    parts.neck(s.chest, s.head);
    parts.head(s.head);
    // hair sits on the back and top of the head, away from the face
    const up: V = [s.head[0] - s.chest[0], s.head[1] - s.chest[1], s.head[2] - s.chest[2]];
    const ul = Math.hypot(up[0], up[1], up[2]) || 1;
    parts.hair([s.head[0] - s.front[0] * 0.028 + (up[0] / ul) * 0.03, s.head[1] - s.front[1] * 0.028 + (up[1] / ul) * 0.03, s.head[2] - s.front[2] * 0.028 + (up[2] / ul) * 0.03]);
    parts.armR(s.shR, s.elR);
    parts.armL(s.shL, s.elL);
    parts.sleeveR(s.shR, s.elR);
    parts.sleeveL(s.shL, s.elL);
    parts.elR(s.elR);
    parts.elL(s.elL);
    parts.foreR(s.elR, s.haR);
    parts.foreL(s.elL, s.haL);
    parts.haR(s.haR);
    parts.haL(s.haL);
    parts.hipR(s.hipR);
    parts.hipL(s.hipL);
    parts.thighR(s.hipR, s.knR);
    parts.thighL(s.hipL, s.knL);
    parts.shortR(s.hipR, s.knR);
    parts.shortL(s.hipL, s.knL);
    parts.knR(s.knR);
    parts.knL(s.knL);
    parts.shinR(s.knR, s.anR);
    parts.shinL(s.knL, s.anL);
    parts.anR(s.anR);
    parts.anL(s.anL);
    parts.footR(s.anR, s.toR);
    parts.footL(s.anL, s.toL);
    parts.toR(s.toR);
    parts.toL(s.toL);
  };

  const dispose = () => {
    for (const m of meshes) if (m.geometry !== sphereGeo) m.geometry.dispose();
    sphereGeo.dispose();
    for (const m of [skin, shirt, shorts, hair]) m.dispose();
  };
  return { group, setSkeleton, dispose };
}

function canvasTexture(THREE: T, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A calm yoga room: wooden floor, a warm wall with tall windows, soft daylight. */
function buildStudio(THREE: T, scene: THREE_NS.Scene) {
  scene.background = new THREE.Color(0xe9e2d6);
  scene.fog = new THREE.Fog(0xe9e2d6, 9, 22);
  const wood = canvasTexture(THREE, 512, 512, (g) => {
    g.fillStyle = "#c9a57c";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "rgba(120,80,40,0.10)" : "rgba(255,240,210,0.08)";
      g.fillRect(0, i * 64, 512, 64);
      g.fillStyle = "rgba(80,50,25,0.35)";
      g.fillRect(0, i * 64, 512, 2);
      for (let k = 0; k < 3; k++) g.fillRect(((i * 173 + k * 197) % 512) | 0, i * 64, 2, 64);
    }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const wallTex = canvasTexture(THREE, 1024, 512, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#efe8dc");
    grad.addColorStop(1, "#ddd3c3");
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);
    // tall windows with a soft sky
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 235;
      const sky = g.createLinearGradient(0, 60, 0, 420);
      sky.addColorStop(0, "#cfe3ee");
      sky.addColorStop(1, "#f6efe0");
      g.fillStyle = sky;
      g.fillRect(x, 60, 140, 360);
      g.strokeStyle = "#f7f3ea";
      g.lineWidth = 10;
      g.strokeRect(x, 60, 140, 360);
      g.beginPath();
      g.moveTo(x + 70, 60);
      g.lineTo(x + 70, 420);
      g.moveTo(x, 200);
      g.lineTo(x + 140, 200);
      g.stroke();
    }
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 7), new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }));
  wall.position.set(0, 3.5, -5.5);
  scene.add(wall);
  // a plant in the corner
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xb98a62, roughness: 0.9 }));
  pot.position.set(-3.2, 0.2, -4.3);
  scene.add(pot);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x5f7f5a, roughness: 0.9 });
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), leafMat);
    const a = (i / 7) * Math.PI * 2;
    leaf.scale.set(0.5, 1.6, 0.25);
    leaf.position.set(-3.2 + Math.cos(a) * 0.22, 0.85 + (i % 3) * 0.14, -4.3 + Math.sin(a) * 0.22);
    leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
    scene.add(leaf);
  }
  const hemi = new THREE.HemisphereLight(0xfff6e8, 0xb39b80, 1.1);
  scene.add(hemi);
  return { sun: new THREE.Color(0xfff1dc), sunPos: new THREE.Vector3(-3.5, 6, 4), mat: 0x7f9a84 };
}

/** A lawn on a clear morning: grass, a soft sky, a few trees and hills far away. */
function buildLawn(THREE: T, scene: THREE_NS.Scene) {
  scene.background = canvasTexture(THREE, 16, 512, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "#7fb4e0");
    grad.addColorStop(0.55, "#cfe6f2");
    grad.addColorStop(0.75, "#f4ecd6");
    grad.addColorStop(1, "#dfe8c8");
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 512);
  });
  scene.fog = new THREE.Fog(0xdcebe6, 14, 60);
  const grass = canvasTexture(THREE, 512, 512, (g) => {
    g.fillStyle = "#7fa863";
    g.fillRect(0, 0, 512, 512);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 9000; i++) {
      const x = rnd() * 512;
      const y = rnd() * 512;
      g.strokeStyle = `rgba(${40 + rnd() * 60},${110 + rnd() * 70},${40 + rnd() * 40},${0.25 + rnd() * 0.35})`;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (rnd() - 0.5) * 4, y - 3 - rnd() * 6);
      g.stroke();
    }
  });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(26, 26);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(70, 48), new THREE.MeshStandardMaterial({ map: grass, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // distant hills
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x8fb08a, roughness: 1 });
  for (const [x, z, r] of [
    [-22, -34, 14],
    [6, -40, 18],
    [30, -32, 12],
  ] as const) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.scale.y = 0.32;
    hill.position.set(x, -0.2, z);
    scene.add(hill);
  }
  // trees
  const trunk = new THREE.MeshStandardMaterial({ color: 0x6d523a, roughness: 1 });
  const crown = new THREE.MeshStandardMaterial({ color: 0x4f7d4a, roughness: 1 });
  for (const [x, z, s] of [
    [-6, -9, 1.2],
    [-9.5, -13, 1.6],
    [5.5, -11, 1.4],
    [9, -8, 1.0],
    [-3, -16, 1.8],
    [13, -15, 1.7],
  ] as const) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.17 * s, 1.6 * s, 10), trunk);
    t.position.set(x, 0.8 * s, z);
    t.castShadow = true;
    scene.add(t);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.SphereGeometry((1.0 - k * 0.18) * s, 14, 10), crown);
      c.position.set(x + (k - 1) * 0.35 * s, (1.9 + k * 0.45) * s, z + (k % 2 ? 0.25 : -0.2) * s);
      c.castShadow = true;
      scene.add(c);
    }
  }
  const hemi = new THREE.HemisphereLight(0xdcefff, 0x6f8f55, 1.15);
  scene.add(hemi);
  return { sun: new THREE.Color(0xfff3d6), sunPos: new THREE.Vector3(4, 7, 5), mat: 0x6b7fb0 };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The 3D yoga view: a figure that moves from pose to pose (and to the mirrored pose on the second side)
 * in a yoga room or on a lawn. Drag to look around. `instant` skips the movement (used for previews).
 */
export function Yoga3D({
  poseId,
  mirror = false,
  place = "studio",
  paused = false,
  instant = false,
  className,
  onUnavailable,
}: {
  poseId: string;
  mirror?: boolean;
  place?: YogaPlace;
  paused?: boolean;
  instant?: boolean;
  className?: string;
  onUnavailable?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef({ poseId, mirror, paused, instant });
  target.current = { poseId, mirror, paused, instant };
  const [ready, setReady] = useState(false);
  const unavailable = useRef(onUnavailable);
  unavailable.current = onUnavailable;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    void import("three")
      .then((THREE) => {
        if (disposed) return;
        let renderer: THREE_NS.WebGLRenderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
        } catch {
          unavailable.current?.();
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        el.appendChild(renderer.domElement);
        renderer.domElement.style.display = "block";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.touchAction = "pan-y";

        const scene = new THREE.Scene();
        const env = place === "lawn" ? buildLawn(THREE, scene) : buildStudio(THREE, scene);
        const sun = new THREE.DirectionalLight(env.sun, 2.1);
        sun.position.copy(env.sunPos);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -2.2;
        sun.shadow.camera.right = 2.2;
        sun.shadow.camera.top = 2.6;
        sun.shadow.camera.bottom = -1;
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 20;
        sun.shadow.bias = -0.0015;
        sun.shadow.radius = 4;
        scene.add(sun);
        // the mat
        const mat = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.012, 0.78), new THREE.MeshStandardMaterial({ color: env.mat, roughness: 0.9 }));
        mat.position.set(0, 0.006, 0);
        mat.receiveShadow = true;
        scene.add(mat);

        const figure = createFigure(THREE);
        scene.add(figure.group);

        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        const look = new THREE.Vector3(0, 0.78, 0);
        const azimuth = 0.32;
        const elevation = 0.2;
        let userAz = 0;
        let radius = 4.2;
        let framed = false;
        /** keeps the whole figure in view: the camera follows its centre and backs off for wide poses */
        const placeCamera = (t: number, s: Skeleton, dt: number) => {
          let minX = Infinity, maxX = -Infinity, maxY = 0, minZ = Infinity, maxZ = -Infinity;
          for (const k of ["pelvis", "chest", "head", "haR", "haL", "anR", "anL", "toR", "toL", "knR", "knL", "elR", "elL"] as const) {
            const p = s[k];
            minX = Math.min(minX, p[0]);
            maxX = Math.max(maxX, p[0]);
            maxY = Math.max(maxY, p[1]);
            minZ = Math.min(minZ, p[2]);
            maxZ = Math.max(maxZ, p[2]);
          }
          const cx = (minX + maxX) / 2;
          const cy = Math.max(0.42, (maxY + 0.12) / 2);
          const cz = (minZ + maxZ) / 2;
          const half = Math.max((maxX - minX) / 2 + 0.4, (maxZ - minZ) / 2 + 0.4, ((maxY + 0.45) / 2) * camera.aspect);
          const wantR = Math.min(7, Math.max(3.1, (half / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect) * 1.3));
          const k = framed ? 1 - Math.exp(-dt * 2.2) : 1;
          framed = true;
          look.x += (cx - look.x) * k;
          look.y += (cy - look.y) * k;
          look.z += (cz - look.z) * k;
          radius += (wantR - radius) * k;
          const a = azimuth + userAz + Math.sin(t * 0.12) * 0.1;
          camera.position.set(look.x + Math.sin(a) * radius * Math.cos(elevation), look.y + Math.sin(elevation) * radius, look.z + Math.cos(a) * radius * Math.cos(elevation));
          camera.lookAt(look);
        };

        const resize = () => {
          const w = el.clientWidth || 300;
          const h = el.clientHeight || 225;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          // a tall, narrow view needs a wider lens to keep lying poses in frame
          camera.fov = w / h < 1.1 ? 40 : 32;
          camera.updateProjectionMatrix();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        // drag to look around
        let dragX: number | null = null;
        const down = (e: PointerEvent) => (dragX = e.clientX);
        const move = (e: PointerEvent) => {
          if (dragX === null) return;
          userAz -= (e.clientX - dragX) * 0.008;
          dragX = e.clientX;
        };
        const up = () => (dragX = null);
        renderer.domElement.addEventListener("pointerdown", down);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);

        // movement between poses
        const specFor = (id: string, mir: boolean, frame: number): PoseSpec => {
          const frames = framesFor(id);
          const s = frames[frame % frames.length];
          return mir ? mirrorSpec(s) : s;
        };
        let shownKey = "";
        let from = specFor(target.current.poseId, target.current.mirror, 0);
        let to = from;
        let shown = from;
        let t0 = 0;
        let dur = 0;
        let frame = 0;
        let clock = 0;
        let last = performance.now();
        let raf = 0;
        let visible = true;
        const io = new IntersectionObserver((entries) => (visible = entries[0]?.isIntersecting ?? true));
        io.observe(el);

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          const dt = Math.min(0.1, (now - last) / 1000);
          last = now;
          if (!visible || document.hidden) return;
          const cur = target.current;
          if (!cur.paused) clock += dt;
          const key = `${cur.poseId}|${cur.mirror}`;
          if (key !== shownKey) {
            const first = shownKey === "";
            shownKey = key;
            frame = 0;
            from = shown;
            to = specFor(cur.poseId, cur.mirror, 0);
            t0 = clock;
            dur = first || cur.instant ? 0 : 2.6;
          } else if (framesFor(cur.poseId).length > 1 && clock - t0 > dur + 1.2 && !cur.paused) {
            // a flowing pose (cat–cow): keep moving between its frames, in a breathing rhythm
            frame++;
            from = shown;
            to = specFor(cur.poseId, cur.mirror, frame);
            t0 = clock;
            dur = 3.2;
          }
          const k = dur <= 0 ? 1 : Math.min(1, (clock - t0) / dur);
          shown = k >= 1 ? to : blend(from, to, ease(k));
          // a little life: the chest rises and falls with a slow breath
          const breath = Math.sin(clock * 0.9) * 0.008;
          const s = resolve({ ...shown, bend: [shown.bend[0] + shown_front_x(shown) * breath, shown.bend[1], shown.bend[2]] });
          figure.setSkeleton(s);
          placeCamera(clock, s, dt);
          renderer.render(scene, camera);
          if (!ready_) {
            ready_ = true;
            setReady(true);
          }
        };
        let ready_ = false;
        raf = requestAnimationFrame(tick);

        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          renderer.domElement.removeEventListener("pointerdown", down);
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          figure.dispose();
          scene.traverse((o) => {
            const m = o as THREE_NS.Mesh;
            if (m.isMesh) {
              m.geometry?.dispose();
              const mm = m.material as THREE_NS.MeshStandardMaterial;
              mm.map?.dispose();
              mm.dispose?.();
            }
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => unavailable.current?.());
    return () => {
      disposed = true;
      cleanup();
    };
  }, [place]);

  return (
    <div
      ref={host}
      className={cn("relative overflow-hidden rounded-3xl bg-surface-2 ring-1 ring-line/60", className)}
      role="img"
      aria-label={`Postać 3D pokazuje pozycję${mirror ? " (druga strona)" : ""}`}
      data-ready={ready ? "1" : "0"}
    />
  );
}

/** breathing moves the middle of the spine a little, roughly along where the chest faces */
function shown_front_x(p: PoseSpec): number {
  return p.chest[1] - p.pelvis[1] > 0.25 ? 1 : 0;
}
