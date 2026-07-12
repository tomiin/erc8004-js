import {
  mainnet,
  sepolia,
  base,
  baseSepolia,
  celo,
  celoSepolia,
  celoAlfajores,
  arbitrum,
  optimism,
  polygon,
  type Chain,
} from "viem/chains";

/** The Identity + Reputation registry addresses for a given deployment tier. */
export interface RegistrySet {
  identity: `0x${string}`;
  reputation: `0x${string}`;
}

// ERC-8004 uses the same canonical registry addresses across every chain.
// "Mainnet tier" addresses are shared by all mainnets; "testnet tier" by all testnets.
const MAINNET_SET: RegistrySet = {
  identity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  reputation: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
};
const TESTNET_SET: RegistrySet = {
  identity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  reputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
};

/** chainId -> ERC-8004 registries deployed on that chain. */
export const REGISTRIES: Record<number, RegistrySet> = {
  1: MAINNET_SET, // Ethereum
  11155111: TESTNET_SET, // Sepolia
  8453: MAINNET_SET, // Base
  84532: TESTNET_SET, // Base Sepolia
  42220: MAINNET_SET, // Celo
  11142220: TESTNET_SET, // Celo Sepolia (current testnet)
  44787: TESTNET_SET, // Celo Alfajores (deprecated)
  42161: MAINNET_SET, // Arbitrum
  10: MAINNET_SET, // Optimism
  137: MAINNET_SET, // Polygon
};

/** chainId -> viem Chain object. */
export const CHAINS: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  42220: celo,
  11142220: celoSepolia,
  44787: celoAlfajores,
  42161: arbitrum,
  10: optimism,
  137: polygon,
};

/** All chain IDs this SDK ships registry addresses for. */
export const SUPPORTED_CHAIN_IDS: number[] = Object.keys(CHAINS).map(Number);

export function registriesFor(chainId: number): RegistrySet {
  const set = REGISTRIES[chainId];
  if (!set) {
    throw new Error(
      `ERC-8004 registries are not configured for chainId ${chainId}. Supported: ${SUPPORTED_CHAIN_IDS.join(", ")}`,
    );
  }
  return set;
}

export function chainById(chainId: number): Chain {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chainId ${chainId}. Supported: ${SUPPORTED_CHAIN_IDS.join(", ")}`,
    );
  }
  return chain;
}
