"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { FIGURES } from "@/lib/yoga/figures";
import { renderPoseSvg } from "@/lib/yoga/render-svg";
import type { Pose } from "@/lib/yoga/poses";
import photoManifest from "@/data/yoga-photos.json";
import { IconButton, cn } from "./ui";

export interface PhotoEntry {
  file: string;
  author: string;
  license: string;
  licenseUrl?: string;
  source: string;
  attribution: string;
  approved: boolean;
}

const PHOTOS = (photoManifest as { photos: Record<string, PhotoEntry> }).photos;

export function approvedPhoto(id: string): PhotoEntry | null {
  const p = PHOTOS[id];
  return p && p.approved ? p : null;
}

function Visual({ pose, large }: { pose: Pose; large?: boolean }) {
  const photo = approvedPhoto(pose.id);
  const svg = useMemo(() => (FIGURES[pose.id] ? renderPoseSvg(FIGURES[pose.id], { id: `${pose.id}${large ? "-lg" : ""}`, title: pose.alt }) : ""), [pose, large]);
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photo.file} alt={pose.alt} className="h-full w-full object-contain" loading="lazy" decoding="async" />
    );
  }
  return <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label={pose.alt} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function PoseImage({ pose, className, zoomable = true }: { pose: Pose; className?: string; zoomable?: boolean }) {
  const [open, setOpen] = useState(false);
  const photo = approvedPhoto(pose.id);
  return (
    <>
      <div className={cn("relative overflow-hidden rounded-3xl bg-surface ring-1 ring-line/60", className)}>
        <div className="aspect-[4/3] w-full p-3">
          <Visual pose={pose} />
        </div>
        {zoomable && (
          <IconButton label="Powiększ ilustrację" onClick={() => setOpen(true)} className="absolute bottom-2 right-2 h-9 w-9 bg-bg/80 backdrop-blur">
            <Maximize2 className="h-4 w-4" />
          </IconButton>
        )}
        {photo && <p className="absolute bottom-2 left-3 max-w-[75%] truncate text-[10px] text-ink-3">{photo.attribution}</p>}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-bg" />
          <Dialog.Content className="safe-top safe-bottom fixed inset-0 z-[71] flex flex-col px-4 outline-none">
            <div className="flex items-center justify-between py-2">
              <Dialog.Title className="font-display text-[20px] text-ink">{pose.name}</Dialog.Title>
              <Dialog.Close asChild>
                <IconButton label="Zamknij powiększenie">
                  <X className="h-5 w-5" />
                </IconButton>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">{pose.alt}</Dialog.Description>
            <div className="flex flex-1 items-center justify-center">
              <div className="aspect-[4/3] w-full max-w-3xl">
                <Visual pose={pose} large />
              </div>
            </div>
            <p className="pb-4 text-center text-[12px] text-ink-3">
              {photo ? (
                <>
                  {photo.attribution} ·{" "}
                  <a className="underline" href={photo.source} target="_blank" rel="noreferrer">
                    źródło
                  </a>
                </>
              ) : (
                "Ilustracja Decompressly (widok uproszczony)"
              )}
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
