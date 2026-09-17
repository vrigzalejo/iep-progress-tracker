"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FileText, ImagePlus, X } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import {
  EVIDENCE_MAX_BYTES,
  formatEvidenceFileSize,
  suggestEvidenceLabel,
} from "@/lib/evidence-label";
import { cn } from "@/lib/utils";

const ACCEPT = "image/*,.pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.doc,.docx";

function assignFileToInput(input: HTMLInputElement, next: File | null) {
  if (!next) {
    input.value = "";
    return;
  }
  try {
    const transfer = new DataTransfer();
    transfer.items.add(next);
    input.files = transfer.files;
  } catch {
    // Click-to-choose already filled the input. Drag-and-drop still needs this.
  }
}

export function EvidenceAttach({ compact = false }: { compact?: boolean }) {
  const inputId = useId();
  const headingId = useId();
  const hintId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState("");
  const [autoCaption, setAutoCaption] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function applyFile(next: File | null, fromInput = false) {
    const input = inputRef.current;

    if (!next) {
      setFile(null);
      setPreview(null);
      setError("");
      setCaption("");
      setAutoCaption("");
      if (input) assignFileToInput(input, null);
      return;
    }

    if (next.size > EVIDENCE_MAX_BYTES) {
      setError("Choose a photo or PDF under 5 MB.");
      setFile(null);
      setPreview(null);
      if (input) assignFileToInput(input, null);
      return;
    }

    const suggested = suggestEvidenceLabel(next.name);
    setFile(next);
    setError("");
    setCaption((current) => (current.trim() && current !== autoCaption ? current : suggested));
    setAutoCaption(suggested);
    setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
    if (input && !fromInput) assignFileToInput(input, next);
  }

  return (
    <div className="space-y-3">
      <div>
        <p id={headingId} className="text-sm font-semibold text-ink">
          Attach evidence
        </p>
        <p id={hintId} className="mt-1 text-sm text-muted">
          Optional photo or PDF of what was practiced. Under 5 MB. Not required to save the session.
        </p>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        name="evidence"
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        className="sr-only"
        aria-labelledby={headingId}
        onChange={(event) => applyFile(event.target.files?.[0] ?? null, true)}
      />
      {file ? (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-white p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className="h-16 w-16 rounded-md bg-paper object-cover"
              onError={() => setPreview(null)}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-paper text-forest">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{file.name}</p>
            <p className="text-sm text-muted">{formatEvidenceFileSize(file.size)}</p>
            <button
              type="button"
              className="mt-1 text-sm font-semibold text-forest underline"
              onClick={() => inputRef.current?.click()}
            >
              Choose a different file
            </button>
          </div>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-paper"
            onClick={() => applyFile(null)}
            aria-label="Remove evidence"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex min-h-24 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-center",
            dragOver ? "border-forest bg-[#eef6f2]" : "border-border bg-white hover:bg-paper",
          )}
          aria-label="Choose a photo or PDF"
          aria-describedby={hintId}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            applyFile(event.dataTransfer.files[0] ?? null);
          }}
        >
          <ImagePlus className="h-6 w-6 text-forest" aria-hidden="true" />
          <span className="font-semibold text-forest">Choose a photo or PDF</span>
          <span className="text-sm text-muted">Or drop a file here. On a phone, take a picture.</span>
        </button>
      )}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {file ? (
        <div>
          <Label htmlFor={`${inputId}-caption`}>Caption (optional)</Label>
          <Input
            id={`${inputId}-caption`}
            name="evidenceLabel"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={200}
            placeholder="Weekly probe 4, work sample"
          />
        </div>
      ) : (
        <input type="hidden" name="evidenceLabel" value="" />
      )}
      {compact ? (
        <p className="text-sm text-muted">
          Needs a network. Offline Hallway saves scores only — the file is not queued.
        </p>
      ) : null}
    </div>
  );
}
