"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import type { Pose } from "@/lib/yoga/poses";
import { useApp } from "@/lib/store";
import { blobUrl } from "@/lib/db";
import { IconButton, cn } from "./ui";

/** The photos share one dark studio background; tiles use the same colour so they blend in. */
export const PHOTO_BG = "bg-[#24282a]";

/** Object URL of the user's own photo for a pose, if one was added. */
export function useOwnPhoto(poseId: string): string | null {
  const blobId = useApp((s) => s.yogaPhotos?.[poseId]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!blobId) setUrl(null);
    else void blobUrl(blobId).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [blobId]);
  return url;
}

function Visual({ pose, eager }: { pose: Pose; eager?: boolean }) {
  const own = useOwnPhoto(pose.id);
  const srcs = own ? [own] : pose.photos;
  return (
    <div className="flex h-full w-full items-center justify-center gap-1" role="img" aria-label={pose.alt}>
      {srcs.map((src) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" className="h-full min-w-0 flex-1 object-contain" loading={eager ? "eager" : "lazy"} decoding="async" />
      ))}
    </div>
  );
}

export function PoseImage({ pose, className, zoomable = true }: { pose: Pose; className?: string; zoomable?: boolean }) {
  const [open, setOpen] = useState(false);
  const own = useOwnPhoto(pose.id);
  return (
    <>
      <div className={cn("relative overflow-hidden rounded-3xl ring-1 ring-line/60", PHOTO_BG, className)}>
        <div className="aspect-[4/3] w-full p-2">
          <Visual pose={pose} />
        </div>
        {zoomable && (
          <IconButton label="Powiększ zdjęcie" onClick={() => setOpen(true)} className="absolute bottom-2 right-2 h-9 w-9 bg-black/40 text-white backdrop-blur hover:bg-black/55">
            <Maximize2 className="h-4 w-4" />
          </IconButton>
        )}
      </div>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn("fixed inset-0 z-[70]", PHOTO_BG)} />
          <Dialog.Content className="safe-top safe-bottom fixed inset-0 z-[71] flex flex-col px-4 outline-none">
            <div className="flex items-center justify-between py-2">
              <Dialog.Title className="font-display text-[20px] text-white">{pose.name}</Dialog.Title>
              <Dialog.Close asChild>
                <IconButton label="Zamknij powiększenie" className="text-white hover:bg-white/10">
                  <X className="h-5 w-5" />
                </IconButton>
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">{pose.alt}</Dialog.Description>
            <div className="flex flex-1 items-center justify-center">
              <div className="aspect-[4/3] w-full max-w-3xl">
                <Visual pose={pose} eager />
              </div>
            </div>
            <p className="pb-4 text-center text-[12px] text-white/60">{own ? "Twoje zdjęcie" : `${pose.english}${pose.sanskrit ? ` · ${pose.sanskrit}` : ""}`}</p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
