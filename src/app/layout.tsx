import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Navigation from "@/components/Navigation";
import Footer from "@/components/layout/Footer";
import ConfigProviderWrapper from "../context/ConfigProviderWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Journey - Unified Mastery",
  description: "Unifying technical mastery and biological optimization for the 2030 autonomous transition.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <ConfigProviderWrapper>
          <Navigation />
          {children}
          <Footer />
        </ConfigProviderWrapper>
      </body>
    </html>
  );
}
