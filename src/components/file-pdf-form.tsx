import { fileStudentPdfAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function FilePdfForm({
  studentId,
  kind,
  periodLabel,
  returnTo,
  label,
}: {
  studentId: string;
  kind: "PACKET" | "REPORT";
  periodLabel?: string | null;
  returnTo: string;
  label: string;
}) {
  return (
    <form action={fileStudentPdfAction}>
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {periodLabel ? <input type="hidden" name="periodLabel" value={periodLabel} /> : null}
      <Button type="submit" variant="secondary">
        {label}
      </Button>
    </form>
  );
}

export function FiledDocumentList({
  documents,
}: {
  documents: { id: string; kind: string; periodLabel: string | null; createdAt: Date; createdBy: { name: string } }[];
}) {
  if (documents.length === 0) return null;
  return (
    <section className="no-print rounded-lg border border-border bg-paper p-4 text-sm">
      <h2 className="font-semibold">Filed PDFs</h2>
      <ul className="mt-2 space-y-1">
        {documents.map((doc) => (
          <li key={doc.id}>
            <a className="underline" href={`/api/files/${doc.id}`}>
              {doc.kind === "REPORT" ? "Progress report" : "Meeting packet"}
              {doc.periodLabel ? ` · ${doc.periodLabel}` : ""}
            </a>
            <span className="text-muted"> · {doc.createdBy.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
