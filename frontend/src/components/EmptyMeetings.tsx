/** Custom empty-state illustration for the dashboard — a calm desk vignette. */
export default function EmptyMeetings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="No recent meetings">
      <ellipse cx="160" cy="196" rx="120" ry="12" fill="var(--brand-100)" opacity="0.6" />
      <rect x="70" y="70" width="180" height="112" rx="12" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
      <rect x="70" y="70" width="180" height="26" rx="12" fill="var(--brand-50)" />
      <circle cx="84" cy="83" r="3.5" fill="var(--brand-300)" />
      <circle cx="96" cy="83" r="3.5" fill="var(--brand-200)" />
      <circle cx="108" cy="83" r="3.5" fill="var(--brand-200)" />
      <rect x="86" y="112" width="148" height="10" rx="5" fill="var(--ink-200)" />
      <rect x="86" y="130" width="112" height="10" rx="5" fill="var(--ink-200)" />
      <rect x="86" y="148" width="130" height="10" rx="5" fill="var(--ink-200)" />
      <circle cx="245" cy="60" r="16" fill="var(--brand-400)" />
      <path d="M239 60l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 52c6-10 18-10 24 0" stroke="var(--brand-300)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="150" r="10" fill="var(--brand-200)" />
    </svg>
  );
}
