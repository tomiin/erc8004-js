import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
  type Account,
  type Address,
  type Chain,
  type Hash,
  type Log,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { chainById, registriesFor } from "./chains";
import { identityAbi } from "./abi";

export interface Erc8004Config {
  /** Chain to operate on (e.g. 8453 Base, 42220 Celo, 84532 Base Sepolia). */
  chainId: number;
  /** Optional custom RPC URL. Falls back to viem's public RPC for the chain. */
  rpcUrl?: string;
  /** A viem Account to sign write transactions (register / setAgentURI / transfer). */
  account?: Account;
  /** Convenience alternative to `account`: a raw private key to derive the signer. */
  privateKey?: `0x${string}`;
}

export interface AgentInfo {
  agentId: bigint;
  owner: Address;
  agentURI: string;
  agentWallet: Address;
}

/**
 * A tiny client for ERC-8004 Trustless Agent identities (the Identity Registry).
 * Reads are available with no signer; writes require an `account` or `privateKey`.
 */
export class Erc8004 {
  readonly chain: Chain;
  readonly registry: Address;
  private readonly rpcUrl?: string;
  private readonly account?: Account;
  private readonly publicClient: ReturnType<typeof createPublicClient>;

  constructor(config: Erc8004Config) {
    this.chain = chainById(config.chainId);
    this.registry = registriesFor(config.chainId).identity;
    this.rpcUrl = config.rpcUrl;
    this.account =
      config.account ?? (config.privateKey ? privateKeyToAccount(config.privateKey) : undefined);
    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  /** ERC-8004 agent identifier prefix: `eip155:{chainId}:{registry}`. */
  get agentRegistry(): string {
    return `eip155:${this.chain.id}:${this.registry}`;
  }

  private requireWallet() {
    if (!this.account) {
      throw new Error(
        "This action requires a signer. Construct Erc8004 with `account` or `privateKey`.",
      );
    }
    return createWalletClient({
      account: this.account,
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  /** Register a new agent identity pointing at `agentURI`. Mints the identity NFT. */
  async register(agentURI: string): Promise<{ agentId: bigint; txHash: Hash }> {
    const wallet = this.requireWallet();
    const txHash = await wallet.writeContract({
      address: this.registry,
      abi: identityAbi,
      functionName: "register",
      args: [agentURI],
      chain: this.chain,
      account: this.account as Account,
    });
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const agentId = this.parseRegisteredId(receipt.logs);
    if (agentId === undefined) {
      throw new Error("register() succeeded but no Registered event was found in the receipt.");
    }
    return { agentId, txHash };
  }

  /** Read an agent's owner, URI, and (verified) agent wallet from chain. */
  async getAgent(agentId: bigint | number): Promise<AgentInfo> {
    const id = BigInt(agentId);
    const [owner, agentURI, agentWallet] = await Promise.all([
      this.publicClient.readContract({
        address: this.registry,
        abi: identityAbi,
        functionName: "ownerOf",
        args: [id],
      }),
      this.publicClient.readContract({
        address: this.registry,
        abi: identityAbi,
        functionName: "tokenURI",
        args: [id],
      }),
      this.publicClient.readContract({
        address: this.registry,
        abi: identityAbi,
        functionName: "getAgentWallet",
        args: [id],
      }),
    ]);
    return { agentId: id, owner, agentURI, agentWallet };
  }

  /** Update an agent's registration URI (owner/operator only). */
  async setAgentURI(agentId: bigint | number, newURI: string): Promise<Hash> {
    const wallet = this.requireWallet();
    return wallet.writeContract({
      address: this.registry,
      abi: identityAbi,
      functionName: "setAgentURI",
      args: [BigInt(agentId), newURI],
      chain: this.chain,
      account: this.account as Account,
    });
  }

  /** Transfer an agent identity NFT to another address (from the signer). */
  async transferAgent(agentId: bigint | number, to: Address): Promise<Hash> {
    const wallet = this.requireWallet();
    return wallet.writeContract({
      address: this.registry,
      abi: identityAbi,
      functionName: "safeTransferFrom",
      args: [(this.account as Account).address, to, BigInt(agentId)],
      chain: this.chain,
      account: this.account as Account,
    });
  }

  /** Recover the agentId minted by a given register() transaction hash. */
  async agentIdFromTx(txHash: Hash): Promise<bigint | undefined> {
    const receipt = await this.publicClient.getTransactionReceipt({ hash: txHash });
    return this.parseRegisteredId(receipt.logs);
  }

  private parseRegisteredId(logs: Log[]): bigint | undefined {
    for (const log of logs) {
      if (log.address.toLowerCase() !== this.registry.toLowerCase()) continue;
      try {
        const parsed = decodeEventLog({
          abi: identityAbi,
          data: log.data,
          topics: log.topics,
        });
        if (parsed.eventName === "Registered") {
          return parsed.args.agentId;
        }
      } catch {
        // not a matching event; skip
      }
    }
    return undefined;
  }
}
