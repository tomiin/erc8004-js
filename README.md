<p align="center">
  <img src="./assets/banner.png" alt="erc8004-js — ERC-8004 Trustless Agent identity SDK + CLI" width="760" />
</p>

# erc8004-js

> A lightweight TypeScript SDK + CLI for **ERC-8004 "Trustless Agent" identities** — register, read, update, and transfer on-chain agent identities across **Base, Celo, Ethereum, and more**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

I built erc8004-js after registering an ERC-8004 agent by hand and realizing there was no simple, typed way to do it. ERC-8004 gives an AI agent a portable on-chain identity — an ERC-721 whose token URI points to a registration file — and the registries are already live on a dozen chains. But every integration meant hand-writing raw contract calls against the right registry address on the right network.

This is the thin layer I wanted: **register, read, update, and transfer an agent identity in a few lines of code — or one CLI command — on whichever chain you're building on.**

It pairs naturally with agent payment protocols like **x402**: x402 is how an agent gets *paid*; ERC-8004 is how it gets *identified and trusted*.

## Highlights

- 🪪 Full ERC-8004 **Identity Registry** support — `register`, `getAgent`, `setAgentURI`, `transferAgent`
- ⛓️ **Multi-chain out of the box** — first-class support for **Base** and **Celo** (including Celo Sepolia), plus Ethereum, Optimism, Arbitrum, and Polygon
- 🧰 Ships as both an **SDK** and a **CLI**
- 🔒 Fully typed, built on [viem](https://viem.sh)
- 📦 Zero config — canonical registry addresses are baked in per chain

## Install

```bash
npm install erc8004-js viem
```

`viem` is a peer dependency.

## Quick start — SDK

```ts
import { Erc8004 } from "erc8004-js";

// Read (no signer needed)
const sdk = new Erc8004({ chainId: 8453 }); // Base mainnet
const agent = await sdk.getAgent(57064n);
console.log(agent); // { agentId, owner, agentURI, agentWallet }

// Register (needs a signer + a little native gas token)
const signer = new Erc8004({
  chainId: 11142220, // Celo Sepolia
  privateKey: process.env.ERC8004_PRIVATE_KEY as `0x${string}`,
});
const { agentId, txHash } = await signer.register("https://you.github.io/agent.json");
console.log({ agentId, txHash });
```

### API

```ts
new Erc8004({ chainId, rpcUrl?, account?, privateKey? })

sdk.getAgent(agentId)             // -> { agentId, owner, agentURI, agentWallet }
sdk.register(agentURI)            // -> { agentId, txHash }   (needs signer)
sdk.setAgentURI(agentId, newURI)  // -> txHash                (needs signer)
sdk.transferAgent(agentId, to)    // -> txHash                (needs signer)
sdk.agentIdFromTx(txHash)         // -> agentId | undefined
sdk.agentRegistry                 // -> "eip155:{chainId}:{registry}"
```

## Quick start — CLI

```bash
# List supported chains
npx erc8004 chains

# Read an agent on Base
npx erc8004 get --chain 8453 57064

# Register on Celo Sepolia
ERC8004_PRIVATE_KEY=0x... npx erc8004 register --chain 11142220 https://you.github.io/agent.json
```

## Supported chains

| Chain | ID | Tier |
|-------|----|------|
| Ethereum | 1 | mainnet |
| Base | 8453 | mainnet |
| Celo | 42220 | mainnet |
| Optimism | 10 | mainnet |
| Arbitrum | 42161 | mainnet |
| Polygon | 137 | mainnet |
| Base Sepolia | 84532 | testnet |
| Celo Sepolia | 11142220 | testnet |
| Sepolia | 11155111 | testnet |

Run `erc8004 chains` for the live list. Registry addresses are the same canonical values across each tier:

| Tier | Identity Registry | Reputation Registry |
|------|-------------------|---------------------|
| Mainnets | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Testnets | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## Built and validated on Celo

erc8004-js is multi-chain, but Celo is a first-class target. I validated the full flow end-to-end on Celo — registering a live agent (**#396**) on Celo Sepolia with this SDK — and updated it to Celo's current **Celo Sepolia** testnet after Alfajores was deprecated. This project is part of Celo's **Proof of Ship**.

## Why this exists

AI agents are starting to transact on-chain, and they need two things: a way to **pay** and a way to be **trusted**. x402 handles payments; ERC-8004 handles identity, reputation, and validation. But the identity layer had no friendly tooling — so registering an agent meant dropping down to raw contract calls. erc8004-js removes that friction so any developer can give an agent a real, portable on-chain identity in minutes, on the chain they already build on.

## Roadmap

- **v0.1** — Identity Registry (this release): register, read, setAgentURI, transfer.
- **v0.2** — Reputation Registry (`giveFeedback`, `getSummary`).
- **v0.3** — Validation Registry (once the spec stabilizes).
- npm release + more examples.

## Development

```bash
npm install
npm run typecheck
npm run build
```

## License

MIT © tomiin

## Reference

- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- Official contracts: https://github.com/erc-8004/erc-8004-contracts
