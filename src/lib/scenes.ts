/**
 * Places to "move to" during breathing and listening. Each one is a small fragment shader: no photos,
 * no downloads, so it works offline and never repeats exactly. The picture moves with the breath
 * (`uBreath`, 0 = empty lungs, 1 = full) and shifts slightly when the phone is tilted (`uLook`).
 */
export type SceneId = "beach" | "forest" | "lake" | "aurora";
export type SceneChoice = SceneId | "none";

export interface SceneDef {
  id: SceneId;
  label: string;
  hint: string;
  /** shown when the device cannot run the shader, and while it loads */
  fallback: string;
}

export const SCENES: SceneDef[] = [
  { id: "beach", label: "Plaża o zachodzie", hint: "Fala przychodzi z wdechem i cofa się z wydechem.", fallback: "linear-gradient(#2a3470 0%, #d9736b 38%, #ffb86b 54%, #1c4a63 56%, #14344e 80%, #9c7a5e 100%)" },
  { id: "forest", label: "Las o poranku", hint: "Światło między drzewami rozjaśnia się z wdechem.", fallback: "linear-gradient(#c9dba0 0%, #7fa276 45%, #2f4a32 80%, #142015 100%)" },
  { id: "lake", label: "Górskie jezioro", hint: "Mgła nad wodą unosi się z wdechem.", fallback: "linear-gradient(#33507f 0%, #f0c3a6 44%, #5f7896 48%, #23364f 100%)" },
  { id: "aurora", label: "Zorza nad śniegiem", hint: "Zorza jaśnieje z wdechem i przygasa z wydechem.", fallback: "linear-gradient(#03061a 0%, #0c3b3a 45%, #07142b 75%, #0d1830 100%)" },
];

export const SCENE_BY_ID: Record<SceneId, SceneDef> = Object.fromEntries(SCENES.map((s) => [s.id, s])) as Record<SceneId, SceneDef>;

export function isScene(v: unknown): v is SceneId {
  return typeof v === "string" && v in SCENE_BY_ID;
}

/** The next choice when a single button cycles through the places (ends with "none"). */
export function nextScene(v: SceneChoice): SceneChoice {
  const order: SceneChoice[] = [...SCENES.map((s) => s.id), "none"];
  return order[(order.indexOf(v) + 1) % order.length];
}

export const VERTEX = `attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const COMMON = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uBreath;
uniform vec2 uLook;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
  return s;
}
vec3 finish(vec3 col, vec2 uv){
  vec2 q = uv - 0.5;
  col *= 1.0 - 0.35 * dot(q, q);
  col += (hash(uv * uRes + uTime) - 0.5) * 0.012; // breaks up banding in the gradients
  return clamp(col, 0.0, 1.0);
}
`;

const BEACH = `
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float px = (uv.x - 0.5) * asp + uLook.x * 0.05;
  float hz = 0.47 + uLook.y * 0.025;
  vec2 sun = vec2(0.06, hz + 0.07);
  vec3 col;
  if (uv.y > hz) {
    float sy = (uv.y - hz) / (1.0 - hz);
    vec3 sky = mix(vec3(1.0, 0.72, 0.42), vec3(0.86, 0.45, 0.44), smoothstep(0.0, 0.33, sy));
    sky = mix(sky, vec3(0.15, 0.19, 0.42), smoothstep(0.22, 1.0, sy));
    float d = length(vec2(px, uv.y) - sun);
    sky += vec3(1.0, 0.6, 0.3) * exp(-d * 5.0) * 0.5;
    sky = mix(sky, vec3(1.0, 0.96, 0.82), smoothstep(0.06, 0.052, d));
    float cl = fbm(vec2(px * 2.2 + uTime * 0.012, sy * 7.0) + 3.0);
    cl = smoothstep(0.45, 0.75, cl) * smoothstep(0.03, 0.3, sy);
    sky = mix(sky, mix(vec3(1.0, 0.6, 0.45), vec3(0.42, 0.3, 0.46), sy), cl * 0.7);
    col = sky;
  } else {
    float dep = (hz - uv.y) / hz;
    float z = 1.0 / (dep + 0.035);
    vec2 w = vec2(px * z * 1.4, z * 2.5 + uTime * 0.3);
    float wv = fbm(w * vec2(1.0, 3.0));
    vec3 sea = mix(vec3(0.96, 0.62, 0.44), vec3(0.07, 0.2, 0.33), smoothstep(0.0, 0.45, dep));
    sea += (wv - 0.5) * 0.2 * (1.0 - dep * 0.4);
    float gl = exp(-abs(px - sun.x) * (5.0 + 26.0 * (1.0 - dep)));
    gl *= smoothstep(0.5, 0.8, noise(w * vec2(2.0, 9.0)));
    sea += vec3(1.0, 0.8, 0.52) * gl * (1.0 - dep * 0.7) * 1.1;
    // the wave runs up the sand with the inhale and draws back with the exhale
    float sh = 0.1 + 0.11 * uBreath + 0.018 * sin(px * 6.0 + uTime * 0.3) + 0.02 * noise(vec2(px * 7.0, uTime * 0.15));
    sea = mix(sea, vec3(0.5, 0.66, 0.66), smoothstep(sh + 0.13, sh, uv.y) * 0.55);
    float lace = smoothstep(0.52, 0.78, noise(vec2(px * 26.0, (uv.y - sh) * 70.0 - uTime * 0.25))) * smoothstep(sh + 0.07, sh, uv.y);
    sea = mix(sea, vec3(1.0, 0.95, 0.9), lace * 0.55);
    float wet = smoothstep(0.03, 0.24, uv.y);
    vec3 sand = mix(vec3(0.66, 0.5, 0.38), vec3(0.42, 0.3, 0.27), wet);
    sand += vec3(1.0, 0.62, 0.42) * wet * 0.16 * exp(-abs(px - sun.x) * 3.0);
    sand += (noise(vec2(px, uv.y) * 420.0) - 0.5) * 0.05;
    col = mix(sand, sea, smoothstep(sh - 0.004, sh + 0.004, uv.y));
    col = mix(col, vec3(1.0, 0.97, 0.93), smoothstep(0.014, 0.0, abs(uv.y - sh - 0.006)) * 0.85);
  }
  gl_FragColor = vec4(finish(col * 0.92, uv), 1.0);
}`;

const FOREST = `
float trunk(float x, float seed, float width){
  float cell = floor(x), fx = fract(x);
  float c = 0.3 + 0.4 * hash(vec2(cell, seed));
  float w = width * (0.5 + hash(vec2(cell, seed + 7.0)));
  return smoothstep(w, w * 0.72, abs(fx - c));
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float px = (uv.x - 0.5) * asp;
  float y = uv.y + uLook.y * 0.015;
  vec2 sun = vec2(-0.1, 0.84);
  vec2 dv = vec2(px + uLook.x * 0.01, y) - sun;
  float light = 0.75 + 0.45 * uBreath;
  vec3 col = mix(vec3(0.36, 0.52, 0.36), vec3(0.8, 0.88, 0.62), y);
  col += vec3(1.0, 0.95, 0.7) * exp(-length(dv) * 2.4) * 0.55 * light;
  for (int i = 0; i < 5; i++) {
    float k = float(i) / 4.0;
    float x = (px + uLook.x * mix(0.01, 0.1, k) + float(i) * 3.7) * mix(8.0, 3.2, k);
    float ground = mix(0.3, 0.07, k) + 0.035 * noise(vec2(x * 0.8, float(i)));
    float t = max(trunk(x, float(i), mix(0.05, 0.085, k)), smoothstep(ground + 0.006, ground - 0.006, y));
    vec3 tree = mix(vec3(0.5, 0.64, 0.48), vec3(0.06, 0.09, 0.06), k);
    tree += vec3(0.1, 0.14, 0.04) * step(y, ground) * (1.0 - k) * noise(vec2(x * 5.0, y * 40.0));
    col = mix(col, tree, t);
    float mist = fbm(vec2(px * 2.0 + uTime * 0.015 * (float(i) + 1.0), y * 3.0 + float(i) * 2.0));
    col = mix(col, vec3(0.86, 0.92, 0.74), mist * 0.3 * (1.0 - k) * light);
  }
  float a = atan(dv.x, -dv.y);
  float rays = smoothstep(0.25, 0.9, noise(vec2(a * 5.0 + uTime * 0.03, 1.0)) * 0.65 + noise(vec2(a * 13.0 - uTime * 0.02, 5.0)) * 0.35) * exp(-length(dv) * 1.3);
  col += vec3(1.0, 0.95, 0.7) * rays * 0.2 * light;
  float can = smoothstep(0.5, 0.72, fbm(vec2(px * 3.0 + uLook.x * 0.12 + uTime * 0.01, y * 3.0)) + (y - 0.86) * 1.6);
  col = mix(col, vec3(0.07, 0.13, 0.06), can * 0.88);
  for (int j = 0; j < 10; j++) {
    float f = float(j);
    vec2 c = vec2((hash(vec2(f, 1.0)) - 0.5) * asp, 0.15 + 0.6 * hash(vec2(f, 2.0)));
    c += 0.04 * vec2(sin(uTime * 0.21 + f * 2.1), cos(uTime * 0.17 + f * 1.3));
    float g = exp(-length(vec2(px, y) - c) * 90.0) * (0.5 + 0.5 * sin(uTime * 0.6 + f * 4.0));
    col += vec3(1.0, 0.95, 0.6) * g * 0.6;
  }
  gl_FragColor = vec4(finish(col * 0.9, uv), 1.0);
}`;

const LAKE = `
vec3 above(float px, float y, float hz){
  float sy = (y - hz) / (1.0 - hz);
  vec3 col = mix(vec3(0.98, 0.78, 0.66), vec3(0.55, 0.62, 0.8), smoothstep(0.0, 0.4, sy));
  col = mix(col, vec3(0.17, 0.27, 0.5), smoothstep(0.3, 1.0, sy));
  vec2 sun = vec2(-0.12, hz + 0.13);
  float d = length(vec2(px, y) - sun);
  col += vec3(1.0, 0.75, 0.5) * exp(-d * 4.5) * 0.5;
  col = mix(col, vec3(1.0, 0.95, 0.85), smoothstep(0.045, 0.038, d));
  float cl = smoothstep(0.5, 0.8, fbm(vec2(px * 2.0 + uTime * 0.008, sy * 8.0)));
  col = mix(col, vec3(1.0, 0.82, 0.74), cl * 0.45 * smoothstep(0.05, 0.4, sy));
  // three ridges, the farthest with snow
  float r1 = hz + 0.1 + 0.26 * fbm(vec2(px * 1.3 + 4.0, 1.0));
  vec3 m1 = mix(vec3(0.5, 0.56, 0.72), vec3(0.95, 0.93, 0.95), smoothstep(r1 - 0.09, r1 - 0.01, y) * smoothstep(hz + 0.17, hz + 0.27, y));
  col = mix(col, m1, smoothstep(r1 + 0.003, r1 - 0.003, y));
  float r2 = hz + 0.05 + 0.2 * fbm(vec2(px * 1.9 + 9.0, 5.0));
  col = mix(col, vec3(0.3, 0.38, 0.52), smoothstep(r2 + 0.003, r2 - 0.003, y));
  float r3 = hz + 0.015 + 0.1 * fbm(vec2(px * 3.2 + 2.0, 8.0)) + 0.012 * noise(vec2(px * 60.0, 3.0));
  col = mix(col, vec3(0.1, 0.17, 0.2), smoothstep(r3 + 0.003, r3 - 0.003, y));
  return col;
}
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float px = (uv.x - 0.5) * asp + uLook.x * 0.04;
  float hz = 0.45 + uLook.y * 0.02;
  vec3 col;
  if (uv.y > hz) {
    col = above(px, uv.y, hz);
  } else {
    float dep = (hz - uv.y) / hz;
    float rip = sin(dep * 150.0 / (dep + 0.25) - uTime * 0.9) * 0.004 * dep + (noise(vec2(px * 12.0, dep * 60.0 - uTime * 0.25)) - 0.5) * 0.02 * dep;
    col = above(px + rip, hz + (hz - uv.y) * 0.95 + rip, hz);
    col = mix(col, vec3(0.1, 0.19, 0.3), 0.3 + 0.35 * dep);
    // slow rings spreading from one point, one for every breath
    vec2 c = vec2(px - 0.05, (uv.y - 0.16) * 3.2);
    float r = length(c);
    col += vec3(0.9, 0.85, 0.8) * sin(r * 34.0 - uBreath * 6.2832) * exp(-r * 5.5) * 0.07;
  }
  float mist = fbm(vec2(px * 2.5 + uTime * 0.02, uv.y * 9.0)) * exp(-abs(uv.y - hz - 0.01) * (26.0 - 14.0 * uBreath));
  col = mix(col, vec3(0.97, 0.9, 0.86), clamp(mist * (0.75 + 0.6 * uBreath), 0.0, 0.85));
  gl_FragColor = vec4(finish(col * 0.93, uv), 1.0);
}`;

const AURORA = `
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  float px = (uv.x - 0.5) * asp + uLook.x * 0.04;
  float y = uv.y + uLook.y * 0.02;
  vec3 col = mix(vec3(0.03, 0.08, 0.15), vec3(0.005, 0.012, 0.05), smoothstep(0.15, 1.0, y));
  vec2 g = vec2(px, y) * 70.0;
  vec2 id = floor(g);
  float st = hash(id);
  float star = smoothstep(0.985, 1.0, st) * smoothstep(0.35, 0.0, length(fract(g) - 0.5));
  col += vec3(0.9, 0.95, 1.0) * star * (0.6 + 0.4 * sin(uTime * (0.6 + st * 2.0) + st * 60.0));
  float power = 0.55 + 0.65 * uBreath;
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float f = float(i);
    float x = px * 1.3 + f * 0.7;
    float y0 = 0.5 + 0.11 * f + 0.07 * sin(x * 2.2 + uTime * 0.09 + f * 2.0) + 0.12 * fbm(vec2(x * 1.4 + uTime * 0.04, f * 3.0));
    float dy = y - y0;
    float curtain = exp(-max(dy, 0.0) * 4.5) * smoothstep(-0.035, 0.0, dy);
    curtain *= 0.45 + 0.55 * noise(vec2(x * 20.0 + uTime * 0.25, f));
    curtain *= 0.55 + 0.45 * noise(vec2(x * 2.0 - uTime * 0.05, f + 4.0));
    glow += mix(vec3(0.15, 1.0, 0.55), vec3(0.55, 0.3, 0.95), smoothstep(0.0, 0.3, dy)) * curtain * (0.5 - 0.1 * f);
  }
  col += glow * power;
  // snowy hills and a line of spruces
  float h1 = 0.2 + 0.06 * fbm(vec2(px * 2.0 + 3.0, 1.0));
  float tx = px * 16.0;
  float th = 0.03 + 0.05 * hash(vec2(floor(tx), 3.0));
  float tree = step(abs(fract(tx) - 0.5) * 0.11, (h1 + th - y) * 0.5) * step(h1 - 0.01, y);
  col = mix(col, vec3(0.01, 0.025, 0.04), tree);
  vec3 snow = mix(vec3(0.07, 0.11, 0.2), vec3(0.12, 0.19, 0.3), smoothstep(0.0, h1, y));
  snow += vec3(0.1, 0.5, 0.3) * 0.16 * power * (0.6 + 0.4 * noise(vec2(px * 5.0, y * 30.0)));
  col = mix(col, snow, smoothstep(h1 + 0.002, h1 - 0.002, y));
  float h2 = 0.09 + 0.05 * fbm(vec2(px * 3.0 + uLook.x * 0.3 + 8.0, 4.0));
  col = mix(col, vec3(0.03, 0.05, 0.1), smoothstep(h2 + 0.002, h2 - 0.002, y));
  gl_FragColor = vec4(finish(col, uv), 1.0);
}`;

export const FRAGMENT: Record<SceneId, string> = {
  beach: COMMON + BEACH,
  forest: COMMON + FOREST,
  lake: COMMON + LAKE,
  aurora: COMMON + AURORA,
};
