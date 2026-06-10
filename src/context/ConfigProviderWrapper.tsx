"use client";

import { ConfigProvider } from "./ConfigContext";

export default function ConfigProviderWrapper({ children }: { children: React.ReactNode }) {
  return <ConfigProvider>{children}</ConfigProvider>;
}
