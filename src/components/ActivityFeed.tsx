"use client";

import React, { useEffect, useState } from "react";
import { useVault } from "@/context/VaultContext";
import { getExplorerTxUrl, formatAddress } from "@/lib/web3";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldAlert, 
  ShieldCheck,
  SlidersHorizontal, 
  Clock, 
  Key, 
  ExternalLink,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
  Info
} from "lucide-react";

interface RouteEvaluation {
  name?: string;
  amountIn?: string;
  returned?: string;
  loss?: string;
  lossBps?: number;
  reason?: string;
}

interface EventItem {
  id: string;
  eventType: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  details: {
    amount?: string | number;
    count?: number;
    totalSimulations?: number;
    simulatedLoss?: string;
    netProfit?: string;
    reason?: string;
    routes?: RouteEvaluation[];
    initialPolicy?: string;
    [key: string]: unknown;
  };
}

export function ActivityFeed() {
  const { selectedVault, network } = useVault();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (!selectedVault?.address) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch(`/api/vaults/${selectedVault.address}/activity`);
        const data = await res.json();
        if (data.events) {
          setEvents(data.events);
        }
      } catch (e) {
        console.error("Failed to load activity:", e);
      }
    };

    setIsLoading(true);
    fetchEvents().finally(() => setIsLoading(false));

    // Live poll every 5s so incoming agent actions appear in real time
    const interval = setInterval(fetchEvents, 5000);
    return () => clearInterval(interval);
  }, [selectedVault?.address]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <ArrowDownLeft className="w-5 h-5 text-indigo-400" />;
      case "WITHDRAW":
        return <ArrowUpRight className="w-5 h-5 text-emerald-400" />;
      case "TRADE_EXECUTED":
        return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case "CIRCUIT_BREAKER_TRIPPED":
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case "POLICY_UPDATE":
        return <SlidersHorizontal className="w-5 h-5 text-indigo-400" />;
      case "POLICY_QUEUED":
        return <Clock className="w-5 h-5 text-amber-400" />;
      case "PAUSED":
        return <Pause className="w-5 h-5 text-amber-400" />;
      case "UNPAUSED":
        return <Play className="w-5 h-5 text-emerald-400" />;
      case "AGENT_GRANTED":
      case "AGENT_REVOKED":
        return <Key className="w-5 h-5 text-indigo-400" />;
      case "SWAP_SKIPPED":
        return <ShieldAlert className="w-5 h-5 text-amber-400" />;
      default:
        return <SlidersHorizontal className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatEventType = (type: string) => {
    if (type === "SWAP_SKIPPED") return "SWAP HALTED (CAPITAL PROTECTED)";
    return type.replace(/_/g, " ");
  };

  if (!selectedVault) return null;

  return (
    <div className="openui-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>On-Chain Activity Feed</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Indexed transactions and pre-flight protection verified from HashKey Chain
          </p>
        </div>
        <span className="text-sm text-slate-400 font-mono font-medium">
          {events.length} Events Logged
        </span>
      </div>

      {isLoading && events.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[#0e111a] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-sm">
          No transactions indexed for this vault yet.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {events.map((evt) => {
            const isSkipped = evt.eventType === "SWAP_SKIPPED";
            const isExpanded = expandedEvents[evt.id] || false;
            const count = evt.details?.count ? Number(evt.details.count) : 1;

            return (
              <div
                key={evt.id}
                className="p-4 rounded-2xl bg-[#0e111a] hover:bg-[#141824] border border-white/5 transition-all text-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      {getEventIcon(evt.eventType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-bold text-white">
                          {formatEventType(evt.eventType)}
                        </span>

                        {/* Clubbed Count Badge: +1, +2, etc. */}
                        {isSkipped && count > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            +{count - 1} more blocked
                          </span>
                        )}

                        {/* Simulated Loss Prevention Badge */}
                        {Boolean(evt.details?.simulatedLoss) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold badge-rose flex items-center gap-1">
                            <span>Avoided {String(evt.details.simulatedLoss)} Fee Bleed</span>
                          </span>
                        )}

                        {/* Net Profit for successful executions */}
                        {Boolean(evt.details?.netProfit) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold badge-emerald">
                            {String(evt.details.netProfit)}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        <span>•</span>
                        {Boolean(evt.details?.amount) && (
                          <span>
                            Amount: <strong className="text-white">{String(evt.details.amount)} USDT</strong>
                          </span>
                        )}
                        {Boolean(evt.details?.route) && !isSkipped && (
                          <span>Route: {JSON.stringify(evt.details.route)}</span>
                        )}
                        {Boolean(evt.details?.initialPolicy) && <span>{String(evt.details.initialPolicy)}</span>}
                        {Boolean(evt.details?.reason) && (
                          <span className={isSkipped ? "text-amber-300 font-medium" : "text-rose-300 font-medium"}>
                            {String(evt.details.reason)}
                          </span>
                        )}

                        {/* Toggle Route Details */}
                        {isSkipped && Boolean(evt.details?.routes?.length) && (
                          <>
                            <span>•</span>
                            <button
                              onClick={() => toggleExpand(evt.id)}
                              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors underline decoration-indigo-400/40"
                            >
                              <span>{isExpanded ? "Hide Routes" : "View Evaluated Routes"}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tx Hash Link or Invariant Badge */}
                  {evt.txHash === "simulated" ? (
                    <div
                      className="flex items-center gap-1.5 font-mono text-xs text-emerald-400 shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 font-bold"
                      title="Pre-flight on-chain simulation via eth_call - 0 gas spent"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Invariant Guard</span>
                    </div>
                  ) : (
                    <a
                      href={getExplorerTxUrl(evt.txHash, network)}
                      target="_blank"
                      rel="noreferrer"
                      id={`explorer-link-${evt.id}`}
                      className="flex items-center gap-1.5 font-mono text-xs text-indigo-400 hover:text-indigo-300 shrink-0 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-bold"
                      title="View on HashKey Blockscout"
                    >
                      <span>{formatAddress(evt.txHash, 3)}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Expandable Evaluated Routes Breakdown */}
                {isSkipped && isExpanded && Boolean(evt.details?.routes?.length) && (
                  <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-fadeIn">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                      <span>Evaluated Cycle Routes (DEX Simulation)</span>
                      <span>0 Gas Spent (eth_call)</span>
                    </div>

                    <div className="space-y-1.5">
                      {evt.details.routes?.map((route, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-rose-400 font-bold">✕</span>
                            <span className="text-white font-medium">{route.name || "USDT Cycle"}</span>
                            <span className="text-slate-400">(${route.amountIn || "2.00"} USDT)</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-slate-400">
                              Return: <strong className="text-slate-200">${route.returned}</strong>
                            </span>
                            <span className="text-rose-400 font-bold">{route.loss}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              InsufficientReturn
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/5 flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Why was this swap blocked?</strong> Market pool prices are currently in parity. Swapping would incur a -0.60% DEX liquidity fee. The on-chain <code className="text-indigo-300">RiskKernelVault</code> contract enforces <code className="text-indigo-300">InsufficientReturn</code>, automatically halting non-profitable cycles before broadcasting to protect your vault balance.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
