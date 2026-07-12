# erc8004-js

A lightweight **TypeScript SDK + CLI** for [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) "Trustless Agent" identities — register, read, update, and transfer on-chain agent identities across **Base, Celo, Ethereum, and more**.

ERC-8004 gives an AI agent a portable on-chain identity (an ERC-721 whose token URI points to a registration file). The registries are already deployed at canonical addresses on many chains; this library is a thin, typed wrapper over the Identity Registry so you don't have to hand-roll contract calls.

> Pairs naturally with agent payment protocols like **x402**: x402 is how an agent gets *paid*, ERC-8004 is how it's *identified and trusted*.

## Install

```bash
npm install erc8004-js viem
```

`viem` is a peer dependency.

## Quick start (SDK)

```ts
import { Erc8004 } from "erc8004-js";

// Read (no signer needed)
const sdk = new Erc8004({ chainId: 8453 }); // Base mainnet
const agent = await sdk.getAgent(57064n);
console.log(agent);
// { agentId, owner, agentURI, agentWallet }

// Register (needs a signer + a little native gas token)
const signer = new Erc8004({
  chainId: 42220, // Celo mainnet
  privateKey: process.env.ERC8004_PRIVATE_KEY as `0x${string}`,
});
const { agentId, txHash } = await signer.register("https://you.github.io/agent.json");
console.log({ agentId, txHash });
```

### API

```ts
new Erc8004({ chainId, rpcUrl?, account?, privateKey? })

sdk.getAgent(agentId)              // -> { agentId, owner, agentURI, agentWallet }
sdk.register(agentURI)             // -> { agentId, txHash }   (needs signer)
sdk.setAgentURI(agentId, newURI)   // -> txHash                (needs signer)
sdk.transferAgent(agentId, to)     // -> txHash                (needs signer)
sdk.agentIdFromTx(txHash)          // -> agentId | undefined
sdk.agentRegistry                  // -> "eip155:{chainId}:{registry}"
```

## Quick start (CLI)

```bash
# List supported chains
npx erc8004 chains

# Read an agent on Base
npx erc8004 get --chain 8453 57064

# Register on Celo (Karma sponsors gas differently; you need a little CELO)
ERC8004_PRIVATE_KEY=0x... npx erc8004 register --chain 42220 https://you.github.io/agent.json
```

## Supported chains

Identity + Reputation registries ship for: Ethereum (1), Sepolia (11155111), **Base (8453)**, **Base Sepolia (84532)**, **Celo (42220)**, **Celo Sepolia (11142220)**, Celo Alfajores (44787, deprecated), Arbitrum (42161), Optimism (10), Polygon (137). Run `erc8004 chains` for the live list.

Registry addresses (same across all deployments of each tier):

| Tier | Identity Registry | Reputation Registry |
|------|-------------------|---------------------|
| Mainnets | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Testnets | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |

## Roadmap

- **v0.1** — Identity Registry (this release): register, read, setAgentURI, transfer.
- **v0.2** — Reputation Registry (giveFeedback, getSummary).
- **v0.3** — Validation Registry (once the spec stabilizes).

## Development

```bash
npm install
npm run typecheck
npm run build
```

## License

MIT

## Reference

- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- Official contracts: https://github.com/erc-8004/erc-8004-contracts
