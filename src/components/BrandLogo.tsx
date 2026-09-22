import React from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

/**
 * App mark: ascending bars (growth) with a rising trend line and node,
 * set in a squircle. Used in the navbar and on the welcome screen.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 48, className = '' }) => {
  const gradientId = React.useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label="My Finance Manager"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="0.55" stopColor="#059669" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="18" fill={`url(#${gradientId})`} />

      {/* Ascending bars */}
      <rect x="15" y="36" width="7" height="14" rx="3.5" fill="#fff" fillOpacity="0.5" />
      <rect x="28.5" y="29" width="7" height="21" rx="3.5" fill="#fff" fillOpacity="0.75" />
      <rect x="42" y="20" width="7" height="30" rx="3.5" fill="#fff" />

      {/* Growth line rising to a node */}
      <path
        d="M17 31 L31.5 23 L45.5 14"
        stroke="#fff"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.95"
      />
      <circle cx="45.5" cy="13.5" r="4.5" fill="#fff" />
      <circle cx="45.5" cy="13.5" r="2" fill="#059669" />
    </svg>
  );
};
