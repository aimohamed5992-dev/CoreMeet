/**
 * Custom vector illustration for the landing hero — a cluster of floating
 * video tiles on a soft brand-tinted field. Pure SVG, theme-aware, no assets.
 */
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 520 460"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Illustration of a CoreMeet video call"
    >
      <defs>
        <linearGradient id="hg-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-100)" />
          <stop offset="1" stopColor="var(--brand-50)" />
        </linearGradient>
        <linearGradient id="hg-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--brand-400)" />
          <stop offset="1" stopColor="var(--brand-600)" />
        </linearGradient>
        <filter id="hg-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#0d1b12" floodOpacity="0.14" />
        </filter>
      </defs>

      <rect x="24" y="30" width="472" height="400" rx="40" fill="url(#hg-bg)" />

      {/* main tile */}
      <g filter="url(#hg-shadow)">
        <rect x="70" y="86" width="256" height="188" rx="22" fill="var(--surface)" />
        <circle cx="198" cy="168" r="46" fill="url(#hg-tile)" />
        <circle cx="198" cy="150" r="17" fill="#fff" />
        <path d="M164 214c4-20 18-30 34-30s30 10 34 30z" fill="#fff" />
        <rect x="86" y="242" width="70" height="14" rx="7" fill="var(--brand-100)" />
      </g>

      {/* secondary tile */}
      <g filter="url(#hg-shadow)">
        <rect x="300" y="150" width="170" height="132" rx="20" fill="var(--surface)" />
        <circle cx="385" cy="212" r="34" fill="var(--brand-200)" />
        <circle cx="385" cy="199" r="13" fill="#fff" />
        <path d="M360 246c3-15 12-22 25-22s22 7 25 22z" fill="#fff" />
      </g>

      {/* third tile */}
      <g filter="url(#hg-shadow)">
        <rect x="150" y="300" width="150" height="116" rx="20" fill="var(--surface)" />
        <circle cx="225" cy="352" r="30" fill="var(--brand-300)" />
        <circle cx="225" cy="341" r="11" fill="#fff" />
        <path d="M203 382c2-13 10-19 22-19s20 6 22 19z" fill="#fff" />
      </g>

      {/* control bar */}
      <g filter="url(#hg-shadow)">
        <rect x="316" y="322" width="150" height="52" rx="26" fill="var(--surface)" />
        <circle cx="346" cy="348" r="14" fill="var(--brand-500)" />
        <circle cx="391" cy="348" r="14" fill="var(--brand-100)" />
        <circle cx="436" cy="348" r="14" fill="var(--danger)" />
      </g>

      {/* floating dots */}
      <circle cx="70" cy="60" r="9" fill="var(--brand-300)" />
      <circle cx="470" cy="110" r="7" fill="var(--brand-400)" />
      <circle cx="440" cy="410" r="11" fill="var(--brand-200)" />
    </svg>
  );
}
