import React from 'react';

export default function Logo({ className = '', width = 140, height = 36 }: { className?: string, width?: number, height?: number }) {
  return (
    <svg 
      className={className} 
      width={width} 
      height={height} 
      viewBox="0 0 140 36" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="6" width="16" height="16" rx="4" fill="var(--primary)" />
      <rect x="14" y="14" width="16" height="16" rx="4" fill="var(--primary)" fillOpacity="0.8" />
      <text 
        x="38" 
        y="25" 
        fill="var(--fg)" 
        fontFamily="var(--font-outfit), sans-serif" 
        fontSize="24" 
        fontWeight="bold"
        letterSpacing="-0.02em"
      >
        Pro<tspan fill="var(--primary)">Link</tspan>
      </text>
    </svg>
  );
}
