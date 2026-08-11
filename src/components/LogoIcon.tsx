import React from "react";

export default function LogoIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Upward step trajectory */}
      <path d="M4 18h4v-4h4v-4h4V6" />
      {/* Arrow head */}
      <path d="M14 6h4v4" />
      {/* Dynamic curve path with start node */}
      <circle cx="4" cy="18" r="1.5" fill="currentColor" />
      <path d="M4 18C7 16 10 12 18 6" strokeWidth="2.5" />
    </svg>
  );
}
