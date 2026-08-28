import { Skeleton } from "@/components/ui/alert";
import { APP_NAME } from "@/lib/brand";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <p className="sr-only">Loading {APP_NAME}</p>
    </div>
  );
}
