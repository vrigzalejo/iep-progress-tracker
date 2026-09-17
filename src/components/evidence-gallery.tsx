"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { setEvidenceInPacketAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export type EvidenceItem = {
  id: string;
  evidenceLabel: string | null;
  evidencePath: string | null;
  evidenceInPacket: boolean;
  recordedAt: Date | string;
  goalSummary: string;
};

function looksLikeImage(item: EvidenceItem) {
  const name = `${item.evidenceLabel ?? ""} ${item.evidencePath ?? ""}`.toLowerCase();
  return /\.(png|jpe?g|gif|webp|svg)(\b|$)/.test(name) || name.includes("image");
}

export function EvidenceGallery({
  items,
  returnTo,
  canFlag,
}: {
  items: EvidenceItem[];
  returnTo: string;
  canFlag: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const current = items.find((item) => item.id === openId);

  if (items.length === 0) {
    return <p className="text-sm text-muted">No work samples are on file yet.</p>;
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-lg border border-border bg-white p-3">
            <p className="font-semibold">{item.evidenceLabel || "Work sample"}</p>
            <p className="text-sm text-muted">
              {formatDate(item.recordedAt)} · {item.goalSummary}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOpenId(item.id)}>
                Open
              </Button>
              <Button asChild variant="secondary" size="sm">
                <a href={`/api/evidence/${item.id}`}>Download</a>
              </Button>
            </div>
            {canFlag ? (
              <form action={setEvidenceInPacketAction} className="mt-3">
                <input type="hidden" name="entryId" value={item.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="evidenceInPacket"
                    defaultChecked={item.evidenceInPacket}
                    onChange={(event) => event.currentTarget.form?.requestSubmit()}
                  />
                  Used in meeting packet
                </label>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {current ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={current.evidenceLabel || "Work sample"}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-xl">{current.evidenceLabel || "Work sample"}</p>
                <p className="text-sm text-muted">{current.goalSummary}</p>
              </div>
              <button type="button" className="rounded-md p-2" onClick={() => setOpenId(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              {looksLikeImage(current) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/evidence/${current.id}?inline=1`}
                  alt={current.evidenceLabel || "Work sample"}
                  className="max-h-[70vh] w-full object-contain"
                />
              ) : (
                <p className="text-sm text-muted">Preview is for images. Download the file to open it.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
