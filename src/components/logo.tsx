export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="10" fill="#123d31" />
      <path
        d="M10 32c6-11 10-16 14-16s6 8 14 16"
        fill="none"
        stroke="#f3efe6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="34" cy="16" r="3.2" fill="#e8c27a" />
    </svg>
  );
}
