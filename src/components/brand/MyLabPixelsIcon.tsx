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
        <linearGradient
          id="mylab-pixels-gradient"
          x1="8"
          y1="55"
          x2="56"
          y2="8"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1268C4" />
          <stop offset="0.55" stopColor="#258ED4" />
          <stop offset="1" stopColor="#48C8D7" />
        </linearGradient>
      </defs>

      <rect x="6" y="39" width="15" height="15" rx="4.5" fill="url(#mylab-pixels-gradient)" />
      <rect x="24" y="43" width="12" height="12" rx="3.75" fill="url(#mylab-pixels-gradient)" />
      <rect x="37" y="32" width="10" height="10" rx="3.25" fill="url(#mylab-pixels-gradient)" />
      <rect x="28" y="23" width="9" height="9" rx="3" fill="url(#mylab-pixels-gradient)" />
      <rect x="43" y="18" width="8" height="8" rx="2.75" fill="url(#mylab-pixels-gradient)" />
      <rect x="52" y="11" width="6" height="6" rx="2" fill="url(#mylab-pixels-gradient)" />
      <rect x="43" y="5" width="4" height="4" rx="1.5" fill="url(#mylab-pixels-gradient)" />
    </svg>
  );
}
