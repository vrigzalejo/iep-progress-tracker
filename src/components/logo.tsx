export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#123d31" />
      <path
        d="M6 23c5 0 7-9 11-9s4 5 9-7"
        fill="none"
        stroke="#f3efe6"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <circle cx="25.5" cy="7.5" r="3.1" fill="#e8c27a" />
    </svg>
  );
}
