import React from "react";

export default function LogoIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Journey Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", borderRadius: "4px" }}
    />
  );
}
