'use client';

import { Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent } from 'react';
import { Button } from '@/components/shared/button';
import { Icon } from '@/components/shared/icon';
import { cn } from '@/lib/cn';
import { track } from '@/modules/core';
import {
  ACCEPTED_TYPES,
  MAX_UPLOAD_BYTES,
  type Design,
} from '@/modules/designer/use-designer-state';

interface DesignDropzoneProps {
  design: Design;
  fileError: boolean;
  onDesign: (design: Design) => void;
  onError: (error: boolean) => void;
  onReset: () => void;
  onSample: () => void;
  copy: {
    label: string;
    upload: string;
    helper: string;
    sample: string;
    replace: string;
    reset: string;
    fileError: string;
    dropzoneLabel: string;
    thumbnailAlt: string;
  };
}

const EXTENSIONS = /\.(png|jpe?g|svg|webp)$/i;

function isAccepted(file: File): boolean {
  return (
    (ACCEPTED_TYPES.includes(file.type) || EXTENSIONS.test(file.name)) &&
    file.size <= MAX_UPLOAD_BYTES
  );
}

/** Reads the intrinsic size; SVGs without width/height fall back to their viewBox, then 600 × 300. */
async function measure(file: File, url: string): Promise<{ width: number; height: number }> {
  const img = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => reject(new Error('decode failed')), { once: true });
  });
  img.src = url;
  await loaded;
  if (img.naturalWidth > 0 && img.naturalHeight > 0)
    return { width: img.naturalWidth, height: img.naturalHeight };
  if (file.type === 'image/svg+xml') {
    const text = await file.text();
    const m = /viewBox=["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(text);
    if (m) return { width: Number(m[1]), height: Number(m[2]) };
  }
  return { width: 600, height: 300 };
}

/**
 * Upload dropzone (BRD 6.4.3). Files stay in memory as object URLs and never leave the
 * browser; the previous URL is revoked on replace or reset.
 */
export function DesignDropzone({
  design,
  fileError,
  onDesign,
  onError,
  onReset,
  onSample,
  copy,
}: DesignDropzoneProps) {
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    if (!isAccepted(file)) {
      onError(true);
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const size = await measure(file, url);
      if (design.kind === 'upload') URL.revokeObjectURL(design.url);
      onDesign({ url, kind: 'upload', ...size });
      track('designer_upload', { type: file.type, bytes: file.size });
    } catch {
      URL.revokeObjectURL(url);
      onError(true);
    }
  }

  function onDrop(e: DragEvent<HTMLElement>) {
    e.preventDefault();
    setDragging(false);
    void accept(e.dataTransfer.files[0]);
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={ACCEPTED_TYPES.join(',')}
      aria-label={copy.dropzoneLabel}
      aria-describedby={fileError ? errorId : undefined}
      aria-invalid={fileError || undefined}
      className="sr-only"
      onChange={(e) => {
        void accept(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-small font-medium text-text">{copy.label}</p>
      {design.kind === 'upload' ? (
        <div className="flex h-14 items-center gap-3 rounded-base border border-border bg-surface ps-2 pe-3">
          {/* Object URL preview; next/image cannot optimise blob: sources. */}
          {/* oxlint-disable-next-line nextjs/no-img-element -- blob: URL, never optimisable */}
          <img
            src={design.url}
            alt={copy.thumbnailAlt}
            className="size-10 rounded-inner bg-ground object-contain"
          />
          <div className="ms-auto flex items-center gap-1">
            {input}
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => inputRef.current?.click()}
            >
              {copy.replace}
            </Button>
            <Button
              type="button"
              variant="link"
              size="md"
              className="text-text-muted"
              onClick={() => {
                URL.revokeObjectURL(design.url);
                onReset();
              }}
            >
              {copy.reset}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- drag-and-drop target; the file input inside is the keyboard path */}
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-base border border-dashed px-4 py-6 text-center transition-[border-color,background-color] duration-(--duration-base)',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/50',
              dragging
                ? 'border-primary bg-accent-tint'
                : 'border-border bg-ground hover:border-text-muted/60',
            )}
          >
            {input}
            <span className="grid size-11 place-items-center rounded-pill bg-accent-tint text-primary">
              <Icon icon={Upload} size={20} />
            </span>
            <span className="text-body font-medium text-primary">{copy.upload}</span>
            <span className="text-caption text-text-muted">{copy.helper}</span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="self-start"
            onClick={() => {
              onSample();
              track('designer_sample', {});
            }}
          >
            {copy.sample}
          </Button>
        </>
      )}
      {fileError && (
        <p id={errorId} role="alert" className="text-small text-error">
          {copy.fileError}
        </p>
      )}
    </div>
  );
}
