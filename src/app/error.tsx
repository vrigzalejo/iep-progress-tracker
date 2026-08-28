"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="mt-3 text-muted">
        The page could not be loaded. Student details are not shown in this message.
      </p>
      <p className="mt-2 text-xs text-muted">{error.digest ? `Reference ${error.digest}` : null}</p>
      <button
        type="button"
        className="mt-6 min-h-11 rounded-md bg-forest px-4 font-semibold text-white"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
