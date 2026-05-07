import { createAppKit } from '@reown/appkit/vue'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { SUPPORTED_CHAINS, WAGMI_TRANSPORTS, wagmiConfig } from '@/wagmi.config.js'
import { createWalletConnectors, WALLETCONNECT_PROJECT_ID } from '@/walletConnectors.js'

export const APPKIT_PROJECT_ID = WALLETCONNECT_PROJECT_ID
export const HAS_APPKIT_PROJECT_ID = APPKIT_PROJECT_ID.length > 0

let appKit = null
let walletRuntimeConfig = wagmiConfig

function getAppMetadata() {
  return {
    name: 'Polkadot EVM DApp',
    description: 'Polkadot Hub EVM wallet connection',
    url: typeof window === 'undefined' ? 'https://localhost' : window.location.origin,
    icons: [],
  }
}

function createAppKitAdapter() {
  return new WagmiAdapter({
    networks: SUPPORTED_CHAINS,
    projectId: APPKIT_PROJECT_ID,
    transports: WAGMI_TRANSPORTS,
    // WalletConnect 由官方 adapter 自己注入，这里只传浏览器插件钱包，避免重复注册同名 connector。
    connectors: createWalletConnectors({ walletConnectProjectId: '' }),
  })
}

/**
 * AppKit 需要 project id 才能拉起完整钱包列表，所以这里做成单例初始化。
 * 有 project id 时把运行时 wagmiConfig 切到官方 adapter，页面和 AppKit 才会共享同一份连接状态。
 * 没有配置时直接返回 null，让导航继续走本地兜底弹窗，不影响现有插件钱包连接。
 */
export function initializeAppKit() {
  if (!HAS_APPKIT_PROJECT_ID || typeof window === 'undefined') return null
  if (appKit) return appKit

  const adapter = createAppKitAdapter()
  walletRuntimeConfig = adapter.wagmiConfig

  appKit = createAppKit({
    projectId: APPKIT_PROJECT_ID,
    networks: SUPPORTED_CHAINS,
    defaultNetwork: SUPPORTED_CHAINS[0],
    adapters: [adapter],
    metadata: getAppMetadata(),
    themeMode: 'dark',
    enableWalletConnect: true,
    enableWalletGuide: true,
    enableEIP6963: true,
    enableEmbedded: false,
    allowUnsupportedChain: false,
    features: {
      analytics: false,
      email: false,
      emailShowWallets: true,
      socials: false,
      history: false,
      swaps: false,
      onramp: false,
      send: false,
      receive: false,
    },
  })

  return appKit
}

export function getAppKit() {
  return initializeAppKit()
}

export function getWalletRuntimeConfig() {
  return walletRuntimeConfig
}

/**
 * 仪表盘等页面不直接持有钱包弹窗状态，所以统一派发一个打开事件给导航处理。
 * 这样桌面端和移动端所有“连接钱包”按钮都能走同一套入口。
 */
export function requestWalletPanelOpen() {
  if (typeof window === 'undefined') return false
  window.dispatchEvent(new CustomEvent('wallet-panel:open'))
  return true
}

export async function openWalletSelector(options) {
  const modal = initializeAppKit()
  if (!modal) return false
  await modal.open(options)
  return true
}
