import type { SVGProps } from "react";

/**
 * Monochrome meeting-control icons in the Material Symbols style used by Google
 * Meet. All use `fill: currentColor` so the control bar can render them white.
 */
const svg = (p: SVGProps<SVGSVGElement>) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  ...p,
});

export const MicIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-4.08A7 7 0 0 0 19 11h-2Z" />
  </svg>
);

export const MicOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M15 11V5a3 3 0 0 0-5.94-.6L15 10.34V11ZM4.27 3 3 4.27l6 6V11a3 3 0 0 0 4.31 2.7l1.23 1.23A4.9 4.9 0 0 1 12 16a5 5 0 0 1-5-5H5a7 7 0 0 0 6 6.92V22h2v-4.08a6.9 6.9 0 0 0 2.66-.98L19.73 21 21 19.73 4.27 3Z" />
  </svg>
);

export const CamIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4Z" />
  </svg>
);

export const CamOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M21 6.5l-4 4V7a1 1 0 0 0-1-1H9.82L21 17.18V6.5ZM3.27 2 2 3.27l2.14 2.14A1 1 0 0 0 3 6.5v11a1 1 0 0 0 1 1h13.73L19.73 21 21 19.73 3.27 2Z" />
  </svg>
);

export const PresentIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M20 3H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v2h8v-2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 14H4V5h16v12Zm-8-9-4 4h3v3h2v-3h3l-4-4Z" />
  </svg>
);

export const PresentOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M2.27 2 1 3.27 2.9 5.17A2 2 0 0 0 2 5v12a2 2 0 0 0 2 2h4v2h8v-2h1.73l3 3L22 20.73 2.27 2ZM4 17V6.27L14.73 17H4Zm18 0V5a2 2 0 0 0-2-2H6.27l2 2H20v12h-.73l2 2c.45-.36.73-.9.73-1.5V17Z" />
  </svg>
);

export const RecordIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <circle cx="12" cy="12" r="7" />
  </svg>
);

export const RecordStopIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const ChatIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-2 12H6v-2h12v2Zm0-3H6V9h12v2Zm0-3H6V6h12v2Z" />
  </svg>
);

export const PeopleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62 0-.97.05A4.87 4.87 0 0 1 17 16.5V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z" />
  </svg>
);

export const CallEndIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85a.99.99 0 0 1-1.4-.01L.29 13.08a.99.99 0 0 1 0-1.4C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.68c.39.38.39 1.01 0 1.4l-2.49 2.49a.99.99 0 0 1-1.4.01 11.6 11.6 0 0 0-2.66-1.85.998.998 0 0 1-.56-.9v-3.1A16.11 16.11 0 0 0 12 9Z" />
  </svg>
);

export const MoreIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M12 8a2 2 0 1 0-2-2 2 2 0 0 0 2 2Zm0 2a2 2 0 1 0 2 2 2 2 0 0 0-2-2Zm0 6a2 2 0 1 0 2 2 2 2 0 0 0-2-2Z" />
  </svg>
);

export const TuneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M3 17v2h6v-2H3ZM3 5v2h10V5H3Zm10 16v-2h8v-2h-8v-2h-2v6h2ZM7 9v2H3v2h4v2h2V9H7Zm14 4v-2H11v2h10Zm-6-4h2V7h4V5h-4V3h-2v6Z" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z" />
  </svg>
);

export const SendIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M2 21l21-9L2 3v7l15 2-15 2v7Z" />
  </svg>
);

export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7h-4a5 5 0 1 0 0 10h4v-1.9h-4A3.1 3.1 0 0 1 3.9 12ZM8 13h8v-2H8v2Zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10Z" />
  </svg>
);

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M12 7a5 5 0 1 0 5 5 5 5 0 0 0-5-5Zm0-5h0v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...svg(p)}>
    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36A5.5 5.5 0 0 1 12.36 3.1 9.4 9.4 0 0 0 12 3Z" />
  </svg>
);
