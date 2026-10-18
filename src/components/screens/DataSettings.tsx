"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload, HardDrive } from "lucide-react";
import { flushSave, getState, useStore } from "@/lib/store";
import { getDB, listBlobs, putBlob, requestPersistentStorage, storageEstimate, type StoredBlob } from "@/lib/db";
import { askConfirm, toast } from "@/lib/ui-store";
import { toISODate } from "@/lib/dates";
import type { AppState } from "@/lib/types";
import { Button, Card, Notice, Screen, ScreenHeader, SectionTitle, Toggle } from "../ui";

interface Backup {
  app: "decompressly";
  format: 1;
  exportedAt: string;
  state: AppState;
  blobs?: { id: string; mime: string; kind: StoredBlob["kind"]; label: string; createdAt: number; meta?: Record<string, unknown>; data: string }[];
}

async function toBase64(b: Blob): Promise<string> {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(s: string, mime: string): Blob {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function fmt(n: number) {
  return n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${(n / 1e6).toFixed(1)} MB`;
}

export default function DataSettings() {
  const replaceAll = useStore((s) => s.replaceAll);
  const [withAudio, setWithAudio] = useState(false);
  const [est, setEst] = useState<Awaited<ReturnType<typeof storageEstimate>>>(null);
  const [audioBytes, setAudioBytes] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    void storageEstimate().then(setEst);
    void listBlobs().then((b) => setAudioBytes(b.reduce((a, x) => a + x.bytes, 0)));
  };
  useEffect(refresh, []);

  const exportData = async () => {
    setBusy(true);
    try {
      await flushSave();
      const backup: Backup = { app: "decompressly", format: 1, exportedAt: new Date().toISOString(), state: getState() };
      if (withAudio) {
        const blobs = await listBlobs();
        backup.blobs = [];
        for (const b of blobs) backup.blobs.push({ id: b.id, mime: b.mime, kind: b.kind, label: b.label, createdAt: b.createdAt, meta: b.meta, data: await toBase64(b.blob) });
      }
      download(new Blob([JSON.stringify(backup)], { type: "application/json" }), `decompressly-${toISODate()}${withAudio ? "-z-audio" : ""}.json`);
    } finally {
      setBusy(false);
    }
  };

  const importData = async (file: File) => {
    let parsed: Backup;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return toast("To nie jest poprawny plik kopii.");
    }
    if (parsed?.app !== "decompressly" || !parsed.state) return toast("To nie jest kopia Decompressly.");
    const ok = await askConfirm(
      "Przywrócić kopię?",
      `Kopia z ${new Date(parsed.exportedAt).toLocaleString("pl-PL")}${parsed.blobs ? ` z ${parsed.blobs.length} plikami audio` : ""}. Obecne dane w aplikacji zostaną zastąpione.`,
      "Przywróć",
    );
    if (!ok) return;
    setBusy(true);
    try {
      for (const b of parsed.blobs ?? []) await putBlob(fromBase64(b.data, b.mime), b.kind, b.label, b.meta, b.id);
      replaceAll(parsed.state);
      await flushSave();
      toast("Dane przywrócone.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const wipe = async () => {
    const ok = await askConfirm("Usunąć wszystkie dane?", "Rytuały, pomysły, refleksje, historia i wszystkie nagrania zostaną trwale usunięte z tego urządzenia. Najpierw możesz zrobić eksport.", "Usuń wszystko");
    if (!ok) return;
    const db = await getDB();
    await db.clear("kv");
    await db.clear("blobs");
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    location.replace("/");
  };

  return (
    <Screen tabbed>
      <ScreenHeader title="Dane" subtitle="Wszystko jest zapisane lokalnie na tym urządzeniu." fallback="settings" />

      <SectionTitle>Pamięć</SectionTitle>
      <Card className="space-y-2">
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-sage-deep" />
          <p className="text-[15px] text-ink">
            {est ? `Używane ${fmt(est.usage)} z dostępnych ${fmt(est.quota)}` : "Przeglądarka nie podaje szacunku pamięci."}
          </p>
        </div>
        <p className="text-[13px] text-ink-3">Nagrania audio: {fmt(audioBytes)}</p>
        <p className="text-[13px] text-ink-3">Trwałe przechowywanie: {est?.persisted ? "włączone" : "nie potwierdzone"}</p>
        {!est?.persisted && (
          <Button size="sm" variant="secondary" onClick={async () => (await requestPersistentStorage(), refresh())}>
            Poproś o trwałe przechowywanie
          </Button>
        )}
        <Notice>
          Na iPhonie dane aplikacji dodanej do ekranu głównego są przechowywane trwale. W samej karcie Safari system może je usunąć po kilku tygodniach nieużywania — dlatego zainstaluj aplikację i co jakiś czas rób eksport.
        </Notice>
      </Card>

      <SectionTitle>Eksport</SectionTitle>
      <Card>
        <Toggle label="Dołącz nagrania audio" description="Plik będzie większy, ale zawiera kompletną kopię." checked={withAudio} onChange={setWithAudio} />
        <Button className="mt-2" variant="primary" block onClick={exportData} disabled={busy}>
          <Download className="h-4 w-4" /> Eksportuj kopię (.json)
        </Button>
      </Card>

      <SectionTitle>Import</SectionTitle>
      <Card>
        <Button variant="secondary" block onClick={() => fileRef.current?.click()} disabled={busy}>
          <Upload className="h-4 w-4" /> Przywróć z pliku
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = "";
          }}
        />
      </Card>

      <SectionTitle>Prywatność</SectionTitle>
      <Card>
        <p className="text-[14px] leading-relaxed text-ink-2">
          Decompressly nie ma kont, analityki ani śledzenia. Serwer służy wyłącznie jako bezpieczny pośrednik do ElevenLabs i nie zapisuje Twoich tekstów. Dane nie opuszczają urządzenia, chyba że sam zatwierdzisz generację lub wyeksportujesz kopię.
        </p>
        <Button className="mt-4" variant="danger" block onClick={wipe}>
          Usuń wszystkie dane z urządzenia
        </Button>
      </Card>
    </Screen>
  );
}
