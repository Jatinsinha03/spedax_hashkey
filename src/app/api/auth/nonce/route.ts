import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";



export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address")?.toLowerCase();

  if (!address || !address.startsWith("0x")) {
    return NextResponse.json({ error: "Valid Ethereum address is required" }, { status: 400 });
  }

  try {
    const newNonce = crypto.randomBytes(16).toString("hex");

    const user = await prisma.user.upsert({
      where: { address },
      update: { nonce: newNonce },
      create: {
        address,
        nonce: newNonce,
      },
    });

    const message = `Welcome to HashPilot.\n\nSign this message to authenticate your wallet with HashKey Chain:\nNonce: ${user.nonce}`;

    return NextResponse.json({
      address: user.address,
      nonce: user.nonce,
      message,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED") {
      throw error;
    }
    console.error("Error generating nonce:", error);
    return NextResponse.json({ error: "Failed to generate sign-in challenge" }, { status: 500 });
  }
}
