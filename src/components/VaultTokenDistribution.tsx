"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useVault } from "@/context/VaultContext";
import { formatAddress, getExplorerAddressUrl } from "@/lib/web3";
import { 
  Coins, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  PieChart, 
  ArrowUpRight, 
  ShieldCheck,
  TrendingUp,
  Layers
} from "lucide-react";

interface TokenBalanceInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  isBaseAsset: boolean;
  color: string;
  balance: string;
  balanceFormatted: string;
  numericBalance: number;
  priceUsd: number;
  valueUsd: number;
  percentage: number;
}

interface VaultDistributionData {
  vaultAddress: string;
  totalValueUsd: number;
  totalValueFormatted: string;
  nativeHskBalance: string;
  tokens: TokenBalanceInfo[];
}

export function VaultTokenDistribution() {
  const { selectedVault, vaults, selectVault, network } = useVault();
  const [data, setData] = useState<VaultDistributionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const defaultVaultAddress = (
    process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0x96569fFcb348670f39568AAda596e8f2775310Fd"
  ).toLowerCase();
  const currentVaultAddress = selectedVault?.address || defaultVaultAddress;

  const fetchTokenBalances = useCallback(async () => {
    if (!currentVaultAddress) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vaults/${currentVaultAddress}/tokens`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load token distribution:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentVaultAddress]);

  useEffect(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  // Fallback tokens if API hasn't loaded yet
  const tokens: TokenBalanceInfo[] = data?.tokens || [
    {
      address: selectedVault?.baseAsset || "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029",
      symbol: selectedVault?.baseAssetSymbol || "USDT",
      name: "Tether USD",
      decimals: 6,
      isBaseAsset: true,
      color: "#10b981",
      balance: selectedVault?.balance || "0.00",
      balanceFormatted: selectedVault?.balance || "0.00",
      numericBalance: parseFloat(selectedVault?.balance || "0") || 0,
      priceUsd: 1.0,
      valueUsd: parseFloat(selectedVault?.balance || "0") || 0,
      percentage: 100,
    },
    {
      address: "0xb210d2120d57b758ee163cffb43e73728c471cf1",
      symbol: "WHSK",
      name: "Wrapped HSK",
      decimals: 18,
      isBaseAsset: false,
      color: "#8b5cf6",
      balance: "0.00",
      balanceFormatted: "0.00",
      numericBalance: 0,
      priceUsd: 0.088,
      valueUsd: 0,
      percentage: 0,
    },
    {
      address: "0xefd4bc9afd210517803f293ababd701caeecdfd0",
      symbol: "WETH",
      name: "Wrapped Ether",
      decimals: 18,
      isBaseAsset: false,
      color: "#6366f1",
      balance: "0.00",
      balanceFormatted: "0.00",
      numericBalance: 0,
      priceUsd: 2650,
      valueUsd: 0,
      percentage: 0,
    },
    {
      address: "0x6119ca49a79f5825c8b345F8d7aC36B272565b14",
      symbol: "WBTC",
      name: "Wrapped Bitcoin",
      decimals: 18,
      isBaseAsset: false,
      color: "#f59e0b",
      balance: "0.00",
      balanceFormatted: "0.00",
      numericBalance: 0,
      priceUsd: 68500,
      valueUsd: 0,
      percentage: 0,
    },
  ];

  const totalValue = data ? data.totalValueUsd : (parseFloat(selectedVault?.balance || "0") || 0);

  return (
    <div className="openui-card-elevated p-6 sm:p-8 relative overflow-hidden transition-all border border-white/10 rounded-2xl bg-[#0c0f17]/90 backdrop-blur-md">
      {/* Background radial accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <span>Vault Asset Distribution</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Live On-Chain
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Real-time portfolio composition and token holdings inside your smart contract vault
              </p>
            </div>
          </div>
        </div>

        {/* Vault selector & Refresh control */}
        <div className="flex flex-wrap items-center gap-3">
          {vaults.length > 1 && (
            <div className="flex items-center gap-2 bg-[#131722] px-3 py-1.5 rounded-xl border border-white/10">
              <span className="text-xs text-slate-400 font-medium">Vault:</span>
              <select
                value={currentVaultAddress}
                onChange={(e) => selectVault(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-white outline-none cursor-pointer"
              >
                {vaults.map((v) => (
                  <option key={v.address} value={v.address} className="bg-[#131722] text-white">
                    {formatAddress(v.address, 4)} ({v.baseAssetSymbol})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchTokenBalances}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#131722] hover:bg-[#1a202e] text-slate-200 border border-white/10 transition-all hover:border-indigo-500/30 active:scale-95 disabled:opacity-50"
            title="Refresh on-chain token balances from HashKey Chain"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Refreshing..." : "Sync Balances"}</span>
          </button>

          <a
            href={getExplorerAddressUrl(currentVaultAddress, network)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <span>Blockscout</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Main summary numbers & stacked allocation bar */}
      <div className="my-6 space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Vault Holdings</span>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight mt-1">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm font-sans font-semibold text-slate-400 ml-2">USD Value</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              <span>Base: <strong className="text-white">{parseFloat(selectedVault?.balance || "0").toLocaleString()} USDT</strong></span>
            </div>
            {data?.nativeHskBalance && parseFloat(data.nativeHskBalance) > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block"></span>
                <span>Gas: <strong className="text-white">{parseFloat(data.nativeHskBalance).toFixed(4)} HSK</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Multi-segment allocation visualizer bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-[#131722] rounded-full overflow-hidden p-0.5 border border-white/10 flex">
            {tokens.map((token) => {
              const widthPct = totalValue > 0 ? (token.valueUsd / totalValue) * 100 : (token.isBaseAsset ? 100 : 0);
              if (widthPct <= 0 && !token.isBaseAsset) return null;
              const isHovered = hoveredToken === token.symbol;

              return (
                <div
                  key={token.symbol}
                  onMouseEnter={() => setHoveredToken(token.symbol)}
                  onMouseLeave={() => setHoveredToken(null)}
                  className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300 relative group cursor-pointer"
                  style={{
                    width: `${Math.max(widthPct, 2)}%`,
                    backgroundColor: token.color,
                    filter: isHovered ? "brightness(1.25)" : "none",
                  }}
                  title={`${token.symbol}: ${token.percentage.toFixed(1)}% ($${token.valueUsd.toFixed(2)})`}
                />
              );
            })}
          </div>

          {/* Allocation legends */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            {tokens.map((t) => (
              <button
                key={t.symbol}
                onMouseEnter={() => setHoveredToken(t.symbol)}
                onMouseLeave={() => setHoveredToken(null)}
                className={`flex items-center gap-2 text-xs transition-opacity ${
                  hoveredToken && hoveredToken !== t.symbol ? "opacity-40" : "opacity-100"
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="font-semibold text-slate-200">{t.symbol}:</span>
                <span className="font-mono text-slate-400">
                  {totalValue > 0 ? `${t.percentage.toFixed(1)}%` : (t.isBaseAsset ? "100%" : "0.0%")}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of supported token asset cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 relative z-10">
        {tokens.map((t) => {
          const isSelected = hoveredToken === t.symbol;

          return (
            <div
              key={t.symbol}
              onMouseEnter={() => setHoveredToken(t.symbol)}
              onMouseLeave={() => setHoveredToken(null)}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-[#181e2b] border-indigo-500/50 shadow-lg shadow-indigo-500/10 scale-[1.01]"
                  : "bg-[#10141e]/80 border-white/5 hover:border-white/15 hover:bg-[#131722]"
              }`}
            >
              <div>
                {/* Token Header with Icon & Role */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${t.color}cc, ${t.color}44)`,
                        border: `1px solid ${t.color}88`,
                      }}
                    >
                      {t.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-white tracking-tight leading-none">
                        {t.symbol}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[100px]">
                        {t.name}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      t.isBaseAsset
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                        : "bg-white/5 text-slate-400 border border-white/10"
                    }`}
                  >
                    {t.isBaseAsset ? "Base Vault Asset" : "Arbitrage Pair"}
                  </span>
                </div>

                {/* Token Balance and Value */}
                <div className="py-2.5 my-1 border-y border-white/5 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-400">Balance:</span>
                    <span className="font-mono font-bold text-sm text-white">
                      {t.balanceFormatted}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">Est. Value:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      ${t.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Contract address & actions */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <button
                  onClick={() => handleCopy(t.address)}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                  title="Click to copy token address"
                >
                  {copiedAddress === t.address ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <span>{formatAddress(t.address, 3)}</span>
                      <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                    </>
                  )}
                </button>

                <a
                  href={getExplorerAddressUrl(t.address, network)}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  title="View token contract on Blockscout"
                >
                  <span>Explorer</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
