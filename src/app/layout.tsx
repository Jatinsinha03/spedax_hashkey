import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { VaultProvider } from "@/context/VaultContext";
import { Navbar } from "@/components/Navbar";
import { GlowProvider } from "@/components/GlowProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HashPilot | The AI trades. The contract decides.",
  description:
    "Personal smart-contract trading vault on HashKey Chain. An autonomous AI agent hunts arbitrage on Uniswap V3 inside an on-chain mandate with automated circuit breakers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full dark antialiased`} data-motion="on">
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-[#7c3aed] selection:text-white">
        <GlowProvider />
        <VaultProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
        </VaultProvider>
      </body>
    </html>
  );
}
