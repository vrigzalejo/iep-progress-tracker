import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">We could not find that record</h1>
      <p className="mt-3 text-muted">
        It may not exist, or your role may not include access. ProgressPath hides records you are
        not allowed to see.
      </p>
      <Link href="/" className="mt-6 inline-block font-semibold text-forest underline">
        Return home
      </Link>
    </div>
  );
}
