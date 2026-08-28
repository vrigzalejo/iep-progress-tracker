import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaff } from "@/lib/permissions";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  redirect(isStaff(session.user.role) ? "/dashboard" : "/parent");
}
