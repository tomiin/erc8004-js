#!/usr/bin/env node
import { Erc8004, SUPPORTED_CHAIN_IDS, chainById } from "./index";

interface Parsed {
  flags: Record<string, string | boolean>;
  positional: string[];
}

function parseArgs(argv: string[]): Parsed {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = true;
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function help(): void {
  console.log(`erc8004 — ERC-8004 Trustless Agent identity CLI

Usage:
  erc8004 chains
  erc8004 get      --chain <id> <agentId>
  erc8004 register --chain <id> [--pk <key>] <agentURI>

Options:
  --chain <id>   chain id (default 8453 = Base). Run 'erc8004 chains' to list.
  --rpc <url>    custom RPC URL
  --pk <key>     private key for register (or set ERC8004_PRIVATE_KEY)

Examples:
  erc8004 chains
  erc8004 get --chain 8453 57064
  ERC8004_PRIVATE_KEY=0x... erc8004 register --chain 42220 https://you.github.io/agent.json
`);
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  const { flags, positional } = parseArgs(rest);
  const rpcUrl = typeof flags.rpc === "string" ? flags.rpc : undefined;
  const chainId = flags.chain ? Number(flags.chain) : 8453;

  switch (command) {
    case "chains": {
      for (const id of SUPPORTED_CHAIN_IDS) {
        console.log(`${id}\t${chainById(id).name}`);
      }
      return;
    }

    case "get":
    case "verify": {
      const agentId = positional[0];
      if (!agentId) {
        console.error("Usage: erc8004 get --chain <id> <agentId>");
        process.exitCode = 1;
        return;
      }
      const sdk = new Erc8004({ chainId, rpcUrl });
      const info = await sdk.getAgent(BigInt(agentId));
      console.log(
        JSON.stringify(
          {
            chain: sdk.chain.name,
            agentRegistry: sdk.agentRegistry,
            agentId: info.agentId.toString(),
            owner: info.owner,
            agentURI: info.agentURI,
            agentWallet: info.agentWallet,
          },
          null,
          2,
        ),
      );
      return;
    }

    case "register": {
      const agentURI = positional[0];
      const pk = (typeof flags.pk === "string" ? flags.pk : undefined) ?? process.env.ERC8004_PRIVATE_KEY;
      if (!agentURI) {
        console.error("Usage: erc8004 register --chain <id> [--pk <key>] <agentURI>");
        process.exitCode = 1;
        return;
      }
      if (!pk) {
        console.error("Provide a signer via --pk <key> or the ERC8004_PRIVATE_KEY env var.");
        process.exitCode = 1;
        return;
      }
      const sdk = new Erc8004({ chainId, rpcUrl, privateKey: pk as `0x${string}` });
      console.log(`Registering agent on ${sdk.chain.name}...`);
      const { agentId, txHash } = await sdk.register(agentURI);
      console.log(
        JSON.stringify(
          {
            chain: sdk.chain.name,
            agentId: agentId.toString(),
            txHash,
            agentRegistry: sdk.agentRegistry,
          },
          null,
          2,
        ),
      );
      return;
    }

    default:
      help();
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
