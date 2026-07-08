interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M16 2C10.477 2 6 6.477 6 12c0 7 10 18 10 18s10-11 10-18c0-5.523-4.477-10-10-10z"
        fill="#FF5A1F"
      />
      <rect x="12" y="8" width="4" height="4" fill="#fff" />
      <rect x="16" y="8" width="4" height="4" fill="#FF5A1F" stroke="#fff" strokeWidth="0.5" />
      <rect x="12" y="12" width="4" height="4" fill="#FF5A1F" stroke="#fff" strokeWidth="0.5" />
      <rect x="16" y="12" width="4" height="4" fill="#fff" />
    </svg>
  );
}
