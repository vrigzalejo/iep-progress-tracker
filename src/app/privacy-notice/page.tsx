import Link from "next/link";
import { Logo } from "@/components/logo";
import { Card, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/brand";

export const metadata = { title: "Privacy notice" };

export default function PublicPrivacyNoticePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/sign-in" className="mb-6 flex items-center gap-2">
        <Logo />
        <span className="font-serif text-xl">{APP_NAME}</span>
      </Link>
      <Card>
        <CardTitle>Privacy notice</CardTitle>
        <div className="mt-4 space-y-3 text-sm">
          <p>
            {APP_NAME} helps IEP teams record and share student progress. Student information is
            treated as sensitive educational data.
          </p>
          <p>
            We collect only preferred name, grade, school, assigned staff, guardian contacts, IEP
            goal text, progress scores, session notes, optional evidence files, and messages.
          </p>
          <p>
            Access is role-based. Audit logs record who viewed or changed a record. Student data is
            not used to train AI models. This notice describes product practices; it is not legal
            advice and is not a FERPA certification.
          </p>
        </div>
      </Card>
    </div>
  );
}
