"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { POSE_BY_ID } from "@/lib/yoga/poses";
import { formatClock } from "@/lib/dates";
import { deleteBlob, putBlob } from "@/lib/db";
import { update, useApp } from "@/lib/store";
import { Button, Card, Screen, ScreenHeader, SectionTitle } from "../ui";
import { PoseImage } from "../PoseImage";

/** Downscales a picked photo (max 1400 px) so it stays light in offline storage. */
async function shrinkPhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.85));
}

function OwnPhoto({ poseId, name }: { poseId: string; name: string }) {
  const current = useApp((s) => s.yogaPhotos?.[poseId]);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      let blob: Blob = file;
      try {
        blob = await shrinkPhoto(file);
      } catch {
        /* keep the original if the browser cannot decode it on a canvas */
      }
      const id = await putBlob(blob, "photo", `Zdjęcie: ${name}`, { poseId });
      const prev = current;
      update((s) => {
        s.yogaPhotos = { ...(s.yogaPhotos ?? {}), [poseId]: id };
      });
      if (prev) await deleteBlob(prev);
    } catch {
      setError("Nie udało się zapisać zdjęcia.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    if (!current) return;
    update((s) => {
      if (s.yogaPhotos) delete s.yogaPhotos[poseId];
    });
    await deleteBlob(current);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} aria-label="Wybierz zdjęcie pozycji" />
      <Button size="sm" variant="quiet" disabled={busy} onClick={() => input.current?.click()}>
        <Camera className="h-4 w-4" />
        {current ? "Zmień zdjęcie" : "Dodaj własne zdjęcie"}
      </Button>
      {current && (
        <Button size="sm" variant="danger" onClick={() => void remove()}>
          <Trash2 className="h-4 w-4" />
          Wróć do ilustracji
        </Button>
      )}
      {error && <p className="w-full text-[13px] text-clay">{error}</p>}
    </div>
  );
}

export default function PoseDetail({ id }: { id: string }) {
  const p = POSE_BY_ID[id];
  if (!p) {
    return (
      <Screen tabbed>
        <ScreenHeader title="Nie znaleziono pozycji" fallback="yoga" />
      </Screen>
    );
  }
  return (
    <Screen tabbed>
      <ScreenHeader fallback="yoga" />
      <h1 className="font-display text-[30px] leading-tight tracking-tight text-ink">{p.name}</h1>
      <p className="mt-1 text-[15px] text-ink-2">
        {p.english}
        {p.sanskrit ? ` · ${p.sanskrit}` : ""}
      </p>
      <PoseImage pose={p} className="mt-5" notes />
      <OwnPhoto poseId={p.id} name={p.name} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-3">Czas utrzymania</p>
          <p className="tabular mt-1 text-[17px] text-ink">
            {formatClock(p.holdRange[0])}–{formatClock(p.holdRange[1])}
            {p.bilateral ? " łącznie" : ""}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] uppercase tracking-wide text-ink-3">Strony</p>
          <p className="mt-1 text-[17px] text-ink">{p.bilateral ? "Obie strony" : "Jedna pozycja"}</p>
        </Card>
      </div>

      <SectionTitle>Pozycja początkowa</SectionTitle>
      <p className="px-1 text-[16px] leading-relaxed text-ink">{p.start}</p>

      <SectionTitle>Krok po kroku</SectionTitle>
      <ol className="space-y-3 px-1">
        {p.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[16px] leading-relaxed text-ink">
            <span className="tabular mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[13px] text-sage-deep">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <SectionTitle>Wyjście z pozycji</SectionTitle>
      <p className="px-1 text-[16px] leading-relaxed text-ink">{p.exit}</p>

      <SectionTitle>Typowe błędy</SectionTitle>
      <ul className="space-y-2 px-1">
        {p.mistakes.map((m, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-2">
            <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-3" />
            {m}
          </li>
        ))}
      </ul>

      <SectionTitle>Dla początkujących</SectionTitle>
      <p className="px-1 text-[15px] leading-relaxed text-ink-2">{p.beginner}</p>
      {p.props.length > 0 && <p className="mt-2 px-1 text-[14px] text-ink-3">Pomoce: {p.props.join(", ")}.</p>}

      <SectionTitle>Kiedy pominąć</SectionTitle>
      <Card className="bg-sand/40 shadow-none ring-0">
        <p className="text-[15px] leading-relaxed text-ink">{p.skipWhen}</p>
      </Card>
    </Screen>
  );
}
