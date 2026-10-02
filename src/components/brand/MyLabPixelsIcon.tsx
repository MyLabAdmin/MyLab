'use client';

type MyLabPixelsIconProps = {
  className?: string;
};

export default function MyLabPixelsIcon({
  className = 'h-6 w-6',
}: MyLabPixelsIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mylab-pixels-gradient" x1="10" y1="54" x2="54" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1677D2" />
          <stop offset="1" stopColor="#49C9D8" />
        </linearGradient>
      </defs>

      <rect x="8" y="34" width="14" height="14" rx="3.5" fill="url(#mylab-pixels-gradient)" />
      <rect x="25" y="41" width="11" height="11" rx="3" fill="url(#mylab-pixels-gradient)" />
      <rect x="39" y="31" width="10" height="10" rx="3" fill="url(#mylab-pixels-gradient)" />
      <rect x="31" y="21" width="13" height="13" rx="3.5" fill="url(#mylab-pixels-gradient)" />
      <rect x="47" y="16" width="9" height="9" rx="2.5" fill="url(#mylab-pixels-gradient)" />
      <rect x="42" y="6" width="8" height="8" rx="2.5" fill="url(#mylab-pixels-gradient)" />
      <rect x="53" y="28" width="6" height="6" rx="2" fill="url(#mylab-pixels-gradient)" />
    </svg>
  );
}
