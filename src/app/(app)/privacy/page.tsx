import {
  archiveStudentAction,
  deleteStudentDataAction,
  recordConsentAction,
  runRetentionAction,
  updateRetentionAction,
} from "@/app/actions";
import { Alert, FormError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { requireUser, getOrganization, listVisibleStudents, listAudit } from "@/lib/queries";
import { can } from "@/lib/permissions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { formatDate } from "@/lib/utils";
import { APP_NAME } from "@/lib/brand";
import { hasCurrentConsent } from "@/lib/consent";
import { previewRetentionSweep } from "@/lib/retention-sweep";

export const metadata = { title: "Privacy and data" };

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser();
  const org = await getOrganization(user);
  const students = await listVisibleStudents(user);
  const audit = can(user.role, "audit.view") ? await listAudit(user) : [];
  const { saved, error } = await searchParams;
  const retentionPreview = can(user.role, "privacy.manage")
    ? await previewRetentionSweep(user.organizationId)
    : null;
  const savedTitle =
    saved === "retention-preview"
      ? "Retention dry run recorded"
      : saved === "retention"
        ? "Retention sweep finished"
        : saved
          ? "Privacy settings saved"
          : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Privacy, consent, and data management</h1>
        <p className="mt-2 text-muted">
          Student records in {APP_NAME} are sensitive educational data. This product is designed
          around FERPA-aligned practices. It is not a legal determination of FERPA compliance.
        </p>
      </div>

      <Alert title="We do not use student data to train AI models" tone="success">
        {APP_NAME} does not send IEP goals, progress notes, or student profiles to generative AI
        services. There is no AI goal writer in this product.
      </Alert>
      {savedTitle ? (
        <Alert title={savedTitle} tone="success">
          Your change is recorded in the audit log. Audit rows do not include student names.
        </Alert>
      ) : null}
      <FormError error={error} />

      <Card>
        <CardTitle>Privacy notice</CardTitle>
        <div className="mt-3 space-y-3 text-sm">
          <p>
            {APP_NAME} stores preferred name, school, grade, assigned staff, guardian contact
            information, IEP goal text, progress scores, session notes, optional evidence files, and
            messages needed to support instruction and family communication.
          </p>
          <p>
            Access is limited by role. Sessions use HTTP-only cookies, expire after eight hours, and
            sign out after 20 minutes idle on shared machines. Passwords are hashed. Password accounts
            can enroll an authenticator. All views and changes are written to an audit log. Data in
            transit should be served over HTTPS. Data at rest in production should sit on encrypted
            disks (and, when available, database encryption). Evidence files in production use private
            object storage.
          </p>
          <p>Notice version: {org.noticeVersion}.</p>
        </div>
        {user.role === "PARENT" ? (
          <ul className="mt-4 space-y-4">
            {students.map((student) => {
              const acknowledged = hasCurrentConsent(
                student.consents,
                org.noticeVersion,
                user.name,
              );
              return (
                <li key={student.id} className="rounded-lg border border-border p-4">
                  <p className="font-semibold">{student.preferredName}</p>
                  {acknowledged ? (
                    <p className="mt-1 text-sm text-muted">
                      You acknowledged notice {org.noticeVersion} for this student.
                    </p>
                  ) : (
                    <form action={recordConsentAction} className="mt-3">
                      <input type="hidden" name="studentId" value={student.id} />
                      <Button type="submit">I acknowledge this notice for {student.preferredName}</Button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}
      </Card>

      {can(user.role, "privacy.manage") ? (
        <>
          <Card>
            <CardTitle>Retention</CardTitle>
            <p className="mt-2 text-sm text-muted">
              Default is 2,555 days (about seven years). Align this with your district records
              schedule before production use.
            </p>
            <form action={updateRetentionAction} className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <Label htmlFor="retentionDays">Keep records for (days)</Label>
                <Input
                  id="retentionDays"
                  name="retentionDays"
                  type="number"
                  min={30}
                  max={3650}
                  defaultValue={org.retentionDays}
                />
              </div>
              <Button type="submit">Save retention</Button>
            </form>
            {retentionPreview ? (
              <div className="mt-6 space-y-3 border-t border-border pt-4">
                <p className="text-sm text-muted">
                  Archived profiles older than {retentionPreview.retentionDays} days (
                  {retentionPreview.candidateCount} ready) can be purged. Dry run writes an audit
                  count only. The sweep permanently deletes those archived records and their evidence
                  files.
                </p>
                {retentionPreview.candidates.length > 0 ? (
                  <ul className="text-sm">
                    {retentionPreview.candidates.map((candidate) => (
                      <li key={candidate.id}>
                        {candidate.preferredName} (archived {formatDate(candidate.archivedAt)})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No archived records are past retention.</p>
                )}
                <div className="flex flex-wrap gap-3">
                  <form action={runRetentionAction}>
                    <input type="hidden" name="dryRun" value="true" />
                    <Button type="submit" variant="secondary">
                      Run dry-run
                    </Button>
                  </form>
                  <form action={runRetentionAction}>
                    <input type="hidden" name="dryRun" value="false" />
                    <ConfirmSubmit
                      message="Permanently delete archived records past the retention period? This cannot be undone."
                      label="Purge expired records"
                    />
                  </form>
                </div>
              </div>
            ) : null}
          </Card>
          <Card>
            <CardTitle>Export and deletion</CardTitle>
            <p className="mt-2 text-sm text-muted">
              Export a CSV of visible caseload progress, or download one student’s full file for a
              records request. Deletion is permanent and requires typing the student’s preferred name.
            </p>
            <a className="mt-3 inline-flex min-h-11 items-center font-semibold text-forest underline" href="/api/export">
              Download CSV export
            </a>
            <div className="mt-4">
              <p className="text-sm font-semibold">Student education record (ZIP)</p>
              <ul className="mt-2 space-y-2">
                {students.map((student) => (
                  <li key={student.id}>
                    <a
                      className="inline-flex min-h-11 items-center font-semibold text-forest underline"
                      href={`/api/export/students/${student.id}`}
                    >
                      Download file for {student.preferredName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <form action={deleteStudentDataAction} className="mt-6 space-y-3 rounded-lg border border-danger/30 p-4">
              <p className="font-semibold text-danger">Permanently delete a student record</p>
              <Label htmlFor="studentId">Student</Label>
              <Select id="studentId" name="studentId" required>
                <option value="">Select…</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.preferredName}
                  </option>
                ))}
              </Select>
              <Label htmlFor="confirm">Type the preferred name to confirm</Label>
              <Input id="confirm" name="confirm" required />
              <ConfirmSubmit
                message="This permanently deletes the student record and cannot be undone. Continue?"
                label="Delete permanently"
              />
            </form>
          </Card>
          <Card>
            <CardTitle>Audit history</CardTitle>
            <ul className="mt-3 max-h-96 overflow-auto text-sm">
              {audit.map((item) => (
                <li key={item.id} className="border-b border-border py-2">
                  {formatDate(item.createdAt)} · {item.user.name} · {item.action} · {item.resourceType}
                  {item.details ? ` · ${item.details}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : can(user.role, "student.export") ? (
        <Card>
          <CardTitle>Export your caseload</CardTitle>
          <a className="mt-3 inline-flex font-semibold text-forest underline" href="/api/export">
            Download CSV
          </a>
        </Card>
      ) : null}

      {can(user.role, "student.archive") ? (
        <Card>
          <CardTitle>Archive a profile</CardTitle>
          <p className="mt-2 text-sm text-muted">Archived profiles leave active caseloads but remain in the audit trail until deletion.</p>
          <form action={archiveStudentAction} className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="archiveStudent">Student</Label>
              <Select id="archiveStudent" name="studentId" required>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.preferredName}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary">
              Archive
            </Button>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
