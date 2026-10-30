"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVault } from "@/context/VaultContext";
import { formatAddress } from "@/lib/web3";
import { 
  Wallet, 
  RefreshCw,
  Plus,
  ArrowUpRight,
  ShieldCheck
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLanding = pathname === "/";

  const { 
    walletAddress, 
    isConnected, 
    isAuthenticating, 
    connectWallet, 
    disconnectWallet, 
    vaults, 
    selectedVault, 
    selectVault,
    network,
    refreshVault
  } = useVault();

  const landingLinks = [
    { href: "/#how", label: "How it works" },
    { href: "/#sim", label: "Mandate" },
    { href: "/#spread", label: "Spread" },
    { href: "/#why", label: "Why us" },
    { href: "/#hashkey", label: "HashKey" },
    { href: "/#docs", label: "Docs" },
  ];

  const appLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/policy", label: "Mandate" },
    { href: "/chat", label: "Copilot" },
    { 
      href: "/approvals", 
      label: "Approvals", 
      badge: selectedVault?.pendingPolicy ? "1" : undefined 
    },
    { href: "/opportunities", label: "Feed" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className={`pill-nav ${mobileOpen ? "open" : ""}`} id="nav">
      {/* Brand Logo with Custom Mark */}
      <Link href="/" className="lg-brand" onClick={() => setMobileOpen(false)}>
        <i className="mk-icon" aria-hidden="true" />
        <span className="font-extrabold tracking-tight">Risk Kernel</span>
      </Link>

      {/* Center Navigation Links */}
      <div className="links">
        {isLanding ? (
          <>
            {landingLinks.map((link) => (
              <a 
                key={link.href} 
                href={link.href}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </>
        ) : (
          <>
            <Link 
              href="/"
              className={pathname === "/" ? "act" : ""}
              onClick={() => setMobileOpen(false)}
            >
              Overview
            </Link>
            {appLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={isActive ? "act" : ""}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-black">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* Right Side: Vault Selector & Action Controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Active Vault Dropdown on app pages */}
        {!isLanding && vaults.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#15151d] border border-white/10 text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${
              selectedVault?.status === "ACTIVE" 
                ? "bg-[#0ecb81]" 
                : selectedVault?.status === "PAUSED" 
                ? "bg-[#f0b90b]" 
                : "bg-[#f6465d]"
            }`} />
            <select
              value={selectedVault?.address || ""}
              onChange={(e) => selectVault(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              {vaults.map((v) => (
                <option key={v.address} value={v.address} className="bg-[#15151d] text-white">
                  {formatAddress(v.address)} (${parseFloat(v.balance).toLocaleString()})
                </option>
              ))}
            </select>
            <button 
              onClick={() => refreshVault()} 
              title="Refresh on-chain state" 
              className="text-slate-400 hover:text-white transition-colors ml-0.5"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        {isLanding ? (
          <Link href="/dashboard" className="btn s">
            <span>Launch App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        ) : isConnected && walletAddress ? (
          <div className="flex items-center gap-1.5">
            <span className="px-3 py-1.5 rounded-full bg-[#15151d] border border-white/10 text-xs font-mono font-medium text-slate-200">
              {formatAddress(walletAddress)}
            </span>
            <button
              onClick={disconnectWallet}
              className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 font-mono transition-colors"
              title="Disconnect"
            >
              Exit
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isAuthenticating}
            className="btn s"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>{isAuthenticating ? "Connecting..." : "Connect"}</span>
          </button>
        )}

        {/* Mobile Hamburger Button */}
        <button
          className="burger"
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <i />
        </button>
      </div>
    </nav>
  );
}
