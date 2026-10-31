# 🛡️ HashPilot

> **The AI trades. The contract decides.**  
> An autonomous AI trading agent constrained by mathematical smart-contract mandates on **HashKey Chain Mainnet**.

[![HashKey Chain](https://img.shields.io/badge/Network-HashKey_Chain_Mainnet-7c3aed?style=for-the-badge&logo=ethereum)](https://hashkey.blockscout.com)
[![Chain ID](https://img.shields.io/badge/Chain_ID-177-black?style=for-the-badge)](https://mainnet.hsk.xyz)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📌 Executive Summary

**HashPilot** is a non-custodial smart-contract trading vault paired with an autonomous AI execution worker built specifically for the **HashKey Chain Mainnet**. 

Autonomous AI agents in Web3 offer incredible potential for identifying micro-inefficiencies and cross-pool arbitrage. However, giving an LLM or off-chain bot unrestricted wallet access creates catastrophic risks: prompt injection attacks, compromised bot private keys, slippage griefing, and hallucinated trades. 

**HashPilot solves this by decoupling opportunity intelligence from execution authority.** The AI agent is given restricted permission solely to submit trade proposals to the user's smart-contract vault. The smart contract acts as an immutable on-chain risk kernel: **any trade that violates user-defined risk parameters, maximum drawdown thresholds, slippage limits, or token whitelists is atomically reverted by the EVM.**

---

## 🚨 The Problem

1. **The Custody Dilemma in AI Trading**: Traditional automated trading bots require users to either deposit capital into centralized custodial pools or hand over unrestricted private keys with unlimited ERC-20 allowances.
2. **Prompt Injection & Model Hallucinations**: When LLMs orchestrate financial actions, prompt injections or malformed inputs can trick the agent into routing swaps through malicious honeypot contracts or draining vault liquidity.
3. **MEV, Frontrunning & Slippage Griefing**: Unprotected DEX swaps on nascent liquidity pools often suffer severe slippage, sandwiched trades, or toxic order flow.
4. **No Graceful Human-in-the-Loop**: Existing platforms lack granular, cryptographic escalation workflows when an agent attempts unusually large or outlier trades.

---

## 💡 The HashPilot Solution

HashPilot enforces **defense-in-depth** across three cooperative layers:

```mermaid
flowchart TD
    subgraph Market["HashKey Chain Mainnet"]
        DEX["Uniswap V3 Pools (WHSK / USDT / WETH / WBTC)"]
    end

    subgraph Intelligence["Autonomous Agent Engine"]
        Worker["Pool Scanner & Cycle Calculator"]
        AI["Gemini 1.5 Flash (Copilot & Opportunity Scorer)"]
    end

    subgraph Defense["HashPilot Vault (Smart Contract)"]
        CB["Circuit Breaker (Max Drawdown / Peak Invariant)"]
        Caps["Size & Daily Volume Limits"]
        HIL["Human-in-the-Loop (EIP-712 Signatures)"]
        Exit["Owner-Only Withdrawal Guarantee"]
    end

    Worker -->|Scans Prices| DEX
    Worker -->|Evaluates Route| AI
    AI -->|Validates Risk| Worker
    Worker -->|Executes Trade Call| Defense
    Defense -->|Atomic Swap| DEX
    Defense -->|Revert if Invariant Fails| Defense
```

### 1. Hard On-Chain Mathematical Invariants
- **High-Water Mark Drawdown Floor**: The vault tracks historical peak value (`highWaterMark`). The contract physically forbids any trade that drops vault equity below `peak - maxDrawdownBps` (e.g. 5% max drawdown).
- **Atomic Profit-or-Revert**: Trades are executed in an atomic flash-swap cycle. If the cycle fails to return the required minimum output tokens, the entire transaction reverts on-chain.
- **Rolling Daily Volume & Position Caps**: Trades cannot exceed the user's configured single-trade maximum nor daily volume budget.

### 2. Zero Agent Withdrawal Permissions
- The autonomous agent address possesses **zero transfer or withdrawal permissions**.
- Only the cryptographic vault owner (the user) can withdraw capital or pause the contract. Even if the agent's private key is leaked or compromised, an attacker cannot extract funds.

### 3. Human-in-the-Loop via EIP-712 Typed Signatures
- When an identified trade exceeds the user's autonomous approval threshold (e.g., trades over $2,500 USDT), the agent automatically queues an `ApprovalRequest`.
- The owner reviews the exact swap parameters, token route, and slippage in the HashPilot dashboard and approves it by signing an off-chain EIP-712 message with MetaMask—zero gas cost until submitted.

### 4. Asymmetric Timelock for Policy Changes
- **Safer Policy Changes** (e.g., reducing position limits, lowering max drawdown, removing risky tokens) take effect **instantly**.
- **Riskier Policy Changes** (e.g., increasing position sizes, adding volatile tokens) are placed into a **15-minute on-chain timelock** with plain-English diffs, giving owners time to cancel rogue changes.

---

## ⚡ Key Features

- 🤖 **Autonomous Multi-Token Arbitrage Engine**: Continually scans Uniswap V3 pools on HashKey Chain across multiple fee tiers (0.01%, 0.05%, 0.3%, 1.0%) for triangular and cyclical price spreads.
- 🧠 **Gemini AI Copilot**: Interactive natural language interface powered by Google Gemini. Users can configure mandates conversationally ("Set my risk to conservative with max 3% drawdown"), review market spreads, and evaluate risk scores.
- 📊 **Dynamic Policy Diff Visualizer**: Color-coded policy comparison cards that evaluate parameter updates against on-chain safety invariants before transactions are signed.
- 🛡️ **Interactive Attack Simulator**: A built-in sandbox where users can simulate prompt injections, honeypot tokens, or rogue agent transactions to verify how the smart contract rejects them.
- ⚡ **Real-Time On-Chain Indexer**: Background indexer polling HashKey Chain logs for deposits, withdrawals, swaps, circuit-breaker trips, and policy updates, displayed in an activity timeline.
- 🎨 **Obsidian & Violet Pro UI**: State-of-the-art dark terminal design featuring responsive data tables, live gas estimations, and glassmorphic telemetry cards.

---

## 🌐 HashKey Chain Mainnet Deployments

| Parameter | Mainnet Value |
|:---|:---|
| **Network Name** | HashKey Chain Mainnet |
| **Chain ID** | `177` (`0xb1`) |
| **RPC Endpoint** | `https://mainnet.hsk.xyz` |
| **Block Explorer** | [hashkey.blockscout.com](https://hashkey.blockscout.com) |
| **Native Gas Token** | `HSK` |

### Verified Smart Contracts

| Contract | Address | Explorer Link |
|:---|:---|:---|
| **HashPilot Vault (`RiskKernelVault`)** | `0x96569fFcb348670f39568AAda596e8f2775310Fd` | [View on Blockscout](https://hashkey.blockscout.com/address/0x96569fFcb348670f39568AAda596e8f2775310Fd) |
| **Uniswap V3 Swap Router** | `0x56d15cF00b5D853D6eE4CbB1463E6DAD2899fBf5` | [View on Blockscout](https://hashkey.blockscout.com/address/0x56d15cF00b5D853D6eE4CbB1463E6DAD2899fBf5) |
| **Uniswap V3 Factory** | `0x972cA9D1662F5e029cD18327D29026532E84c742` | [View on Blockscout](https://hashkey.blockscout.com/address/0x972cA9D1662F5e029cD18327D29026532E84c742) |
| **Autonomous Agent Address** | `0xBEdD38f260e3C936d0A743A57F211cde97f7401F` | [View on Blockscout](https://hashkey.blockscout.com/address/0xBEdD38f260e3C936d0A743A57F211cde97f7401F) |

---

## 🪙 Whitelisted Tokens (HashKey Chain Mainnet)

| Asset | Token Symbol | Decimals | Contract Address | Role |
|:---|:---|:---:|:---|:---|
| **Tether USD** | `USDT` | 6 | `0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029` | **Vault Base Currency** |
| **Wrapped HSK** | `WHSK` | 18 | `0xB210D2120d57b758EE163cFfb43e73728c471Cf1` | Cyclical Arbitrage Pair |
| **Wrapped Ether** | `WETH` | 18 | `0xefd4bC9afD210517803f293ABABd701CaeeCdfd0` | Cyclical Arbitrage Pair |
| **Wrapped BTC** | `WBTC` | 18 | `0x6119CA49a79f5825C8B345F8d7aC36B272565b14` | Cyclical Arbitrage Pair |

---

## 🏗️ Technical Architecture & Stack

- **Smart Contracts**: Solidity `^0.8.20`, OpenZeppelin Contracts (`ReentrancyGuard`, `Pausable`, `EIP712`, `SafeERC20`), Custom Invariant Engine.
- **Frontend**: Next.js 16 (App Router, Turbopack, Partial Prefetching, Cache Components), React 19, TypeScript.
- **Styling**: Tailwind CSS v4, Lucide Icons, Glassmorphic CSS Design System.
- **Web3 Integration**: `ethers.js v6`, MetaMask Provider, EIP-712 Typed Signing, SIWE (Sign-In with Ethereum) auth cookies.
- **AI Agent Intelligence**: Google Gemini API (`gemini-1.5-flash`), function calling for intent classification, structured JSON risk scoring.
- **Database & State**: PostgreSQL, Prisma ORM (Users, Vaults, Opportunities, Activity Events, Heartbeats, Approvals).
- **Background Worker**: Node.js worker loop with pool auto-discovery, cycle optimization math, slippage protection, and event indexing.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **PostgreSQL**: Local database or hosted instance (Supabase, Neon, etc.)
- **MetaMask**: Configured with HashKey Chain Mainnet (Chain ID 177) and a small amount of `HSK` for gas.

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/Khushalseth/spedax_hashkey.git
cd spedax_hashkey
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (refer to `.env.example`):

```env
# Database URL (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/hashpilot"

# Session Secret (32+ characters)
SESSION_SECRET="your-super-secure-session-secret-key-at-least-32-chars"

# HashKey Chain Mainnet (Chain ID 177)
NEXT_PUBLIC_CHAIN_ID=177
NEXT_PUBLIC_CHAIN_NAME="HashKey Chain Mainnet"
NEXT_PUBLIC_RPC_URL="https://mainnet.hsk.xyz"
NEXT_PUBLIC_EXPLORER_URL="https://hashkey.blockscout.com"
NEXT_PUBLIC_CURRENCY_SYMBOL="HSK"

# Contract Addresses
NEXT_PUBLIC_VAULT_ADDRESS="0x96569fFcb348670f39568AAda596e8f2775310Fd"
NEXT_PUBLIC_BASE_ASSET_ADDRESS="0xF1B50eD67A9e2CC94Ad3c477779E2d4cBfFf9029"
NEXT_PUBLIC_ALLOWED_TOKENS="0xB210D2120d57b758EE163cFfb43e73728c471Cf1,0xefd4bC9afD210517803f293ABABd701CaeeCdfd0,0x6119CA49a79f5825C8B345F8d7aC36B272565b14"
NEXT_PUBLIC_SWAP_ROUTER_ADDRESS="0x56d15cF00b5D853D6eE4CbB1463E6DAD2899fBf5"

# Google Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# Agent Worker Settings
AGENT_PRIVATE_KEY="optional-private-key-for-submitting-trades"
SIMULATE_ONLY="true"
POLL_INTERVAL_MS="4000"
MIN_NET_PROFIT_USDT="0.005"
```

### 4. Initialize Database
```bash
# Push Prisma schema to your database
npx prisma db push

# Seed initial token catalog and default pools
npm run seed
```

### 5. Run the Application
```bash
# Start Next.js development server
npm run dev

# Open in browser: http://localhost:3000
```

### 6. Run the Autonomous Worker & Indexer
In separate terminal windows:
```bash
# Run the background arbitrage worker (scanning opportunities)
npm run agent

# Or run the worker once in simulation mode
npm run agent:simulate

# Run the on-chain event indexer
npm run index:events
```

---

## 🔒 Security & Invariant Audit Matrix

| Attack / Failure Vector | Traditional Agent Bot | HashPilot Vault Enforcement |
|:---|:---:|:---|
| **Model Hallucination / Bad Trade** | Drains user balance | **Reverts atomically**: Mandate checks verify net return and max drawdown floor. |
| **Prompt Injection via Chat / Input** | Executes attacker payload | **Reverts on-chain**: The contract only accepts pre-whitelisted routers and tokens. |
| **Compromised Agent Key** | Full wallet drained | **Zero loss**: The agent key cannot transfer or withdraw funds; only the owner can exit. |
| **Flash Crash / Slippage Griefing** | High slippage execution | **Blocked**: Max slippage cap (`maxSlippageBps`) and minimum return checks revert toxic trades. |
| **Whale Trade / Capital Over-allocation** | Single trade risks portfolio | **EIP-712 Gate**: Trades above threshold require user's explicit cryptographic signature. |
| **Malicious Policy Tampering** | Instant compromise | **Timelock delay**: Risk-increasing policy edits require a 15-minute public timelock. |

---

## 📜 License

This project is licensed under the **MIT License**.
