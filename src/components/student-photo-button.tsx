"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { setStudentPhotoAction } from "@/actions/students";
import { createClient } from "@/lib/supabase/client";
import { coverCrop, PHOTO_HEIGHT, PHOTO_WIDTH } from "@/lib/photo-resize";

async function toIdPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { sx, sy, sw, sh } = coverCrop(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = PHOTO_WIDTH;
  canvas.height = PHOTO_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  if (!blob) throw new Error("encode failed");
  return blob;
}

/** Take or pick a photo, shrink it on the phone (roughly 20 KB), upload it and link it to the student. */
export function StudentPhotoButton({
  tenantId,
  studentId,
  hasPhoto,
  labels,
}: {
  tenantId: string;
  studentId: string;
  hasPhoto: boolean;
  labels: { add: string; change: string; saving: string; failed: string };
}) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setFailed(false);
    try {
      const photo = await toIdPhoto(file);
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("sc-student-photos")
        .upload(`${tenantId}/${studentId}.jpg`, photo, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
      if (error) throw error;
      const result = await setStudentPhotoAction(studentId);
      if (!result.ok) throw new Error("link failed");
      startTransition(() => router.refresh());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}
        {busy ? labels.saving : hasPhoto ? labels.change : labels.add}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={busy}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {labels.failed}
        </p>
      ) : null}
    </div>
  );
}
