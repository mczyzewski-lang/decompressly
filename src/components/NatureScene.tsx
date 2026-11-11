"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { FRAGMENT, SCENE_BY_ID, SCENES, VERTEX, type SceneChoice, type SceneId } from "@/lib/scenes";
import { cn } from "./ui";

/**
 * iOS shows the motion-permission prompt only from a tap. Call this from the tap that picks a place;
 * without the permission the scene simply drifts on its own.
 */
export function enableTilt() {
  const D = typeof DeviceOrientationEvent !== "undefined" ? (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }) : null;
  if (D?.requestPermission) void D.requestPermission().catch(() => undefined);
}

/**
 * A living place behind a session. `breath` (0..1) may be driven by the breathing session; without it
 * the scene breathes on its own, slowly. Renders at a capped resolution and ~30 fps, stops when hidden.
 */
export function NatureScene({
  scene,
  breath,
  paused = false,
  className,
}: {
  scene: SceneId;
  breath?: MutableRefObject<number>;
  paused?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const breathRef = useRef(breath);
  breathRef.current = breath;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setReady(false);
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return; // the CSS gradient under the canvas stays
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn("scene shader", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT[scene]);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uBreath = gl.getUniformLocation(prog, "uBreath");
    const uLook = gl.getUniformLocation(prog, "uLook");

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      // a soft picture is fine here; a hot phone is not
      const k = Math.min(1.5, window.devicePixelRatio || 1, 760 / Math.max(r.width, r.height, 1));
      const w = Math.max(2, Math.round(r.width * k));
      const h = Math.max(2, Math.round(r.height * k));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const look = { x: 0, y: 0, tx: 0, ty: 0, live: 0 };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      look.tx = Math.max(-1, Math.min(1, e.gamma / 25));
      look.ty = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      look.live = performance.now();
    };
    const onPointer = (e: PointerEvent) => {
      look.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      look.ty = (e.clientY / window.innerHeight - 0.5) * -2;
      look.live = performance.now();
    };
    if (!still) {
      window.addEventListener("deviceorientation", onTilt);
      window.addEventListener("pointermove", onPointer);
    }

    let raf = 0;
    let last = 0;
    let time = 0;
    let own = 0.5;
    let first = true;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      if (!first && dt < 1 / 32) return; // ~30 fps is plenty for slow scenery
      last = now;
      const moving = !pausedRef.current && !still;
      if (moving) time += dt;
      // with nobody steering, the view drifts slowly so the place never stands still
      if (now - look.live > 4000) {
        look.tx = Math.sin(time * 0.07) * 0.6;
        look.ty = Math.sin(time * 0.05 + 1) * 0.4;
      }
      look.x += (look.tx - look.x) * Math.min(1, dt * 2);
      look.y += (look.ty - look.y) * Math.min(1, dt * 2);
      const target = breathRef.current ? breathRef.current.current : 0.5 - 0.5 * Math.cos((time * Math.PI * 2) / 11);
      own += (target - own) * Math.min(1, dt * 6);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, time + 40);
      gl.uniform1f(uBreath, still ? 0.5 : own);
      gl.uniform2f(uLook, still ? 0 : look.x, still ? 0 : look.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (first) {
        first = false;
        setReady(true);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("deviceorientation", onTilt);
      window.removeEventListener("pointermove", onPointer);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [scene]);

  return (
    <div className={cn("overflow-hidden", className)} style={{ background: SCENE_BY_ID[scene].fallback }} data-scene={scene} data-ready={ready ? "1" : "0"} aria-hidden>
      <canvas key={scene} ref={canvasRef} className={cn("h-full w-full transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")} />
    </div>
  );
}

/** Chips to pick a place (or none). `tone="dark"` is for use on top of a scene. */
export function ScenePicker({ value, onChange, tone = "light" }: { value: SceneChoice; onChange: (v: SceneChoice) => void; tone?: "light" | "dark" }) {
  const options: { value: SceneChoice; label: string }[] = [{ value: "none", label: "Bez tła" }, ...SCENES.map((s) => ({ value: s.id as SceneChoice, label: s.label }))];
  return (
    <div role="radiogroup" aria-label="Miejsce" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => {
              if (o.value !== "none") enableTilt();
              onChange(o.value);
            }}
            className={cn(
              "h-9 shrink-0 rounded-full px-4 text-[13px] font-medium ring-1 transition-colors duration-300",
              tone === "dark"
                ? on
                  ? "bg-white/90 text-black ring-transparent"
                  : "bg-black/35 text-white ring-white/25 backdrop-blur"
                : on
                  ? "bg-sage-deep text-bg ring-transparent"
                  : "bg-surface text-ink-2 ring-line",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
