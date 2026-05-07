import { createConfig, http } from '@wagmi/core'
import { defineChain } from 'viem'
import { WALLET_CONNECTORS } from './walletConnectors.js'

// ── Polkadot Hub EVM 链配置 ──────────────────────────────────────────────────

export const polkadotHubTestnet = defineChain({
  id: 420420417,
  name: 'Polkadot Hub TestNet',
  network: 'polkadot-hub-testnet',
  nativeCurrency: { name: 'PAS', symbol: 'PAS', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://services.polkadothub-rpc.com/testnet'] },
    public:  { http: ['https://services.polkadothub-rpc.com/testnet'] },
  },
  blockExplorers: { default: { name: 'BlockScout', url: 'https://blockscout-testnet.polkadot.io' } },
  testnet: true,
})

export const polkadotHubMainnet = defineChain({
  id: 420420419,
  name: 'Polkadot Hub',
  network: 'polkadot-hub',
  nativeCurrency: { name: 'DOT', symbol: 'DOT', decimals: 18 },
  rpcUrls: {
    // 主网 RPC 来自 Polkadot 官方文档；保留两个端点，避免单个服务异常时配置不可用。
    default: { http: ['https://services.polkadothub-rpc.com/mainnet', 'https://eth-rpc.polkadot.io/'] },
    public:  { http: ['https://services.polkadothub-rpc.com/mainnet', 'https://eth-rpc.polkadot.io/'] },
  },
  blockExplorers: { default: { name: 'BlockScout', url: 'https://blockscout.polkadot.io' } },
  testnet: false,
})

export const SUPPORTED_CHAINS = [polkadotHubTestnet, polkadotHubMainnet]

export const CHAIN_MAP = Object.fromEntries(SUPPORTED_CHAINS.map(c => [c.id, c]))

export const getExplorerTxUrl = (chainId, hash) => {
  const chain = CHAIN_MAP[chainId]
  const base  = chain?.blockExplorers?.default?.url
  return base ? `${base}/tx/${hash}` : null
}

export const getExplorerAddrUrl = (chainId, addr) => {
  const chain = CHAIN_MAP[chainId]
  const base  = chain?.blockExplorers?.default?.url
  return base ? `${base}/address/${addr}` : null
}

// ── wagmi 配置 ───────────────────────────────────────────────────────────────

// AppKit 官方 adapter 和项目里的直接 wagmi 调用都要复用这份 transport，避免两边链配置漂移。
export const WAGMI_TRANSPORTS = {
  [polkadotHubTestnet.id]: http(),
  [polkadotHubMainnet.id]: http(),
}

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: WALLET_CONNECTORS,
  transports: WAGMI_TRANSPORTS,
})

// ── BKC ERC1363 代币合约产物 ─────────────────────────────────────────────────

export {
  BKC_TOKEN_ABI,
  BKC_TOKEN_BYTECODE,
  BKC_TOKEN_SOURCE,
} from './contracts/BKCERC1363Token.compiled.js'
