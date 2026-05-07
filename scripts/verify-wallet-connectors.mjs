import assert from 'node:assert/strict'
import { getWalletConnectorIds, selectWalletConnector } from '../src/walletConnectors.js'
import { wagmiConfig } from '../src/wagmi.config.js'

const connectors = [
  { id: 'metaMask', name: 'MetaMask' },
  { id: 'talisman', name: 'Talisman' },
  { id: 'subwallet', name: 'SubWallet' },
  { id: 'injected', name: 'Browser Wallet' },
]

assert.equal(selectWalletConnector(connectors, 'metamask')?.id, 'metaMask')
assert.equal(selectWalletConnector(connectors, 'TALISMAN')?.id, 'talisman')
assert.equal(selectWalletConnector(connectors)?.id, 'injected')
assert.throws(
  () => selectWalletConnector(connectors, 'phantom'),
  /Connector phantom is not configured/,
)

const configuredIds = wagmiConfig.connectors.map(connector => connector.id)
assert.deepEqual(configuredIds, ['metaMask', 'talisman', 'subwallet', 'injected'])
assert.equal(selectWalletConnector(wagmiConfig.connectors, 'subwallet')?.name, 'SubWallet')

const configuredWithWalletConnect = getWalletConnectorIds({
  walletConnectProjectId: 'example-project-id',
})
assert.deepEqual(configuredWithWalletConnect, ['metaMask', 'talisman', 'subwallet', 'walletConnect', 'injected'])

const configuredWithoutWalletConnect = getWalletConnectorIds({
  walletConnectProjectId: '',
})
assert.deepEqual(configuredWithoutWalletConnect, ['metaMask', 'talisman', 'subwallet', 'injected'])
assert.equal(selectWalletConnector([{ id: 'walletConnect', name: 'WalletConnect' }], 'walletConnect')?.id, 'walletConnect')

console.log('wallet connector checks passed')
