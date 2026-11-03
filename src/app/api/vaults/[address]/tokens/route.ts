import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import prisma from "@/lib/prisma";
import { getRpcProvider, getERC20Contract } from "@/lib/contracts/vaultContract";

interface SupportedTokenDef {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  isBaseAsset: boolean;
  color: string;
  defaultPriceUsd: number;
}

const SUPPORTED_TOKENS: SupportedTokenDef[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    address: (
      process.env.NEXT_PUBLIC_BASE_ASSET_ADDRESS || "0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029"
    ).toLowerCase(),
    decimals: 6,
    isBaseAsset: true,
    color: "#10b981", // Emerald
    defaultPriceUsd: 1.0,
  },
  {
    symbol: "WHSK",
    name: "Wrapped HSK",
    address: "0xb210d2120d57b758ee163cffb43e73728c471cf1",
    decimals: 18,
    isBaseAsset: false,
    color: "#8b5cf6", // Violet
    defaultPriceUsd: 0.088,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0xefd4bc9afd210517803f293ababd701caeecdfd0",
    decimals: 18,
    isBaseAsset: false,
    color: "#6366f1", // Indigo
    defaultPriceUsd: 2650.0,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x6119ca49a79f5825c8b345f8d7ac36b272565b14",
    decimals: 18,
    isBaseAsset: false,
    color: "#f59e0b", // Amber
    defaultPriceUsd: 68500.0,
  },
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const vaultAddress = address?.toLowerCase();

  if (!vaultAddress || !ethers.isAddress(vaultAddress)) {
    return NextResponse.json({ error: "Invalid vault address" }, { status: 400 });
  }

  try {
    const provider = getRpcProvider();

    // Fetch latest pool prices from DB if available
    const activePools = await prisma.pool.findMany({
      where: { enabled: true },
      select: { token0: true, token1: true, price0: true, price1: true },
    });

    const tokenBalances = await Promise.all(
      SUPPORTED_TOKENS.map(async (token) => {
        let rawBalance = BigInt(0);
        let formattedBalance = "0.00";

        try {
          const erc20 = getERC20Contract(token.address, provider);
          rawBalance = await erc20.balanceOf(vaultAddress);
          formattedBalance = ethers.formatUnits(rawBalance, token.decimals);
        } catch (err) {
          console.warn(`Could not read balance for ${token.symbol} at ${vaultAddress}:`, err);
        }

        // Determine price
        let priceUsd = token.defaultPriceUsd;
        const matchingPool = activePools.find(
          (p) =>
            (p.token0 === token.address && p.token1 === SUPPORTED_TOKENS[0].address) ||
            (p.token1 === token.address && p.token0 === SUPPORTED_TOKENS[0].address)
        );

        if (matchingPool && token.symbol !== "USDT") {
          try {
            if (matchingPool.token0 === token.address && matchingPool.price0) {
              const p = parseFloat(matchingPool.price0);
              if (p > 0) priceUsd = p;
            } else if (matchingPool.token1 === token.address && matchingPool.price1) {
              const p = parseFloat(matchingPool.price1);
              if (p > 0) priceUsd = p;
            }
          } catch {
            // Keep default fallback
          }
        }

        const numericBalance = parseFloat(formattedBalance) || 0;
        const valueUsd = numericBalance * priceUsd;

        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          isBaseAsset: token.isBaseAsset,
          color: token.color,
          balance: formattedBalance,
          balanceFormatted: numericBalance > 0 
            ? (numericBalance < 0.0001 ? "< 0.0001" : numericBalance.toLocaleString(undefined, { maximumFractionDigits: 6 }))
            : "0.00",
          numericBalance,
          priceUsd,
          valueUsd,
          percentage: 0,
        };
      })
    );

    // Also get native HSK balance
    let nativeHskBalance = "0.00";
    try {
      const hskRaw = await provider.getBalance(vaultAddress);
      nativeHskBalance = ethers.formatEther(hskRaw);
    } catch {
      // Ignored
    }

    // Calculate total vault value in USD
    const totalValueUsd = tokenBalances.reduce((acc, t) => acc + t.valueUsd, 0);

    // Compute allocation percentages
    const tokensWithPercentages = tokenBalances.map((t) => ({
      ...t,
      percentage: totalValueUsd > 0 ? Number(((t.valueUsd / totalValueUsd) * 100).toFixed(2)) : (t.isBaseAsset ? 100 : 0),
    }));

    return NextResponse.json({
      vaultAddress,
      totalValueUsd,
      totalValueFormatted: `$${totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      nativeHskBalance,
      tokens: tokensWithPercentages,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Error fetching vault token distribution:", error);
    return NextResponse.json({ error: "Failed to fetch token balances" }, { status: 500 });
  }
}
