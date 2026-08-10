import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import ConfigProviderWrapper from "../context/ConfigProviderWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Journey",
  description: "A goal-tracking engine for AI engineering, systems, Web3, and career growth.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <ConfigProviderWrapper>
          <div className="app-container">
            <Navigation />
            <main className="app-main">{children}</main>
            <Footer />
          </div>
        </ConfigProviderWrapper>
      </body>
    </html>
  );
}
