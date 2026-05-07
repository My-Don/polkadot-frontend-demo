import { injected, walletConnect } from '@wagmi/connectors'

function getProviderList(windowRef) {
  const ethereum = windowRef?.ethereum
  if (!ethereum) return []
  return Array.isArray(ethereum.providers) ? ethereum.providers : [ethereum]
}

function providerNameIncludes(provider, keyword) {
  const name = provider?.info?.name ?? provider?.name ?? ''
  return String(name).toLowerCase().includes(keyword)
}

function findInjectedProvider(windowRef, matcher) {
  return getProviderList(windowRef).find(matcher)
}

// Polkadot 生态钱包的 EVM 注入入口在不同版本里不完全一致，所以先看专属全局变量，再扫多钱包队列。
const talismanTarget = {
  id: 'talisman',
  name: 'Talisman',
  provider(windowRef) {
    return windowRef?.talismanEth ??
      findInjectedProvider(windowRef, provider =>
        provider?.isTalisman ||
        provider?.isTalismanEthereum ||
        providerNameIncludes(provider, 'talisman')
      )
  },
}

// SubWallet 同时兼容独立注入和 window.ethereum.providers，避免和 MetaMask 并存时只连到第一个钱包。
const subwalletTarget = {
  id: 'subwallet',
  name: 'SubWallet',
  provider(windowRef) {
    return windowRef?.SubWallet?.ethereum ??
      windowRef?.subwallet?.ethereum ??
      findInjectedProvider(windowRef, provider =>
        provider?.isSubWallet ||
        provider?.isSubWalletExtension ||
        providerNameIncludes(provider, 'subwallet')
      )
  },
}

export const WALLETCONNECT_PROJECT_ID = import.meta.env?.VITE_WALLETCONNECT_PROJECT_ID?.trim() ?? ''

export const HAS_WALLETCONNECT_PROJECT_ID = WALLETCONNECT_PROJECT_ID.length > 0

export function getWalletConnectorIds(options = {}) {
  const projectId = options.walletConnectProjectId?.trim() ?? ''
  return [
    'metaMask',
    'talisman',
    'subwallet',
    ...(projectId ? ['walletConnect'] : []),
    'injected',
  ]
}

export function createWalletConnectors(options = {}) {
  const projectId = options.walletConnectProjectId?.trim() ?? ''
  const connectors = [
    injected({ target: 'metaMask', unstable_shimAsyncInject: 1000 }),
    injected({ target: talismanTarget, unstable_shimAsyncInject: 1000 }),
    injected({ target: subwalletTarget, unstable_shimAsyncInject: 1000 }),
  ]

  // WalletConnect 必须有项目 id 才能弹二维码；没有配置时不注册 connector，避免用户点了才报底层错误。
  if (projectId) {
    connectors.push(walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'Polkadot EVM DApp',
        description: 'Polkadot Hub EVM wallet connection',
        url: typeof window === 'undefined' ? 'https://localhost' : window.location.origin,
        icons: [],
      },
    }))
  }

  connectors.push(injected({ unstable_shimAsyncInject: 1000 }))
  return connectors
}

export const WALLET_CONNECTORS = createWalletConnectors({
  walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
})

/**
 * 根据界面上传入的钱包 id 选择 wagmi connector。
 * 默认走通用 injected，未知 id 直接报错，避免悄悄连到列表第一个钱包。
 */
export function selectWalletConnector(connectors, connectorId = 'injected') {
  const requested = connectorId || 'injected'
  const normalized = requested.toLowerCase()
  const connector = connectors.find(item => item.id?.toLowerCase() === normalized)

  if (connector) return connector
  throw new Error(`Connector ${requested} is not configured`)
}
