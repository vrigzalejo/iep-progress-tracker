import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/logo";
import { SignInForm } from "@/components/sign-in-form";
import { Skeleton } from "@/components/ui/alert";
import { isStaff } from "@/lib/permissions";

export const metadata = { title: "Sign in" };

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect(isStaff(session.user.role) ? "/dashboard" : "/parent");
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto mb-8 flex max-w-5xl items-center gap-3">
        <Logo />
        <div>
          <p className="font-serif text-2xl">ProgressPath</p>
          <p className="text-sm text-muted">IEP progress that families and teams can follow.</p>
        </div>
      </div>
      <Suspense fallback={<Skeleton className="mx-auto h-96 max-w-5xl" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
