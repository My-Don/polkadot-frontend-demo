<template>
  <!-- 移动端侧栏会变成底部导航，所以钱包入口单独固定在顶部，确保每个页面都能连接钱包。 -->
  <div class="mobile-wallet-bar">
    <button class="mobile-wallet-btn" @click="openWalletPanel">
      <span :class="['mobile-wallet-dot', wallet.isConnected ? 'on' : 'off']"></span>
      <span class="mobile-wallet-copy">
        <span class="mobile-wallet-title">{{ mobileWalletTitle }}</span>
        <span class="mobile-wallet-meta">{{ mobileWalletMeta }}</span>
      </span>
    </button>
    <button class="mobile-lang-btn" @click="toggleLang()">
      {{ t('common.switchLang') }}
    </button>
  </div>

  <!-- 平板端保留左侧导轨，再把钱包和网络操作提到顶部，给内容区让出更多横向空间。 -->
  <div class="tablet-wallet-bar">
    <button class="tablet-wallet-btn" @click="openWalletPanel">
      <span :class="['tablet-wallet-dot', wallet.isConnected ? 'on' : 'off']"></span>
      <span class="tablet-wallet-copy">
        <span class="tablet-wallet-title">{{ mobileWalletTitle }}</span>
        <span class="tablet-wallet-meta">{{ mobileWalletMeta }}</span>
      </span>
    </button>
    <div class="tablet-wallet-actions">
      <select
        v-if="wallet.isConnected"
        class="tablet-net-select"
        @change="e => handleSwitchNetwork(+e.target.value)"
      >
        <option value="">{{ t('wallet.switchNetwork') }}</option>
        <option v-for="c in supportedChains" :key="`tablet-${c.id}`" :value="c.id">
          {{ c.name }}{{ c.testnet ? ' ✦' : '' }}
        </option>
      </select>
      <button class="tablet-lang-btn" @click="toggleLang()">
        {{ t('common.switchLang') }}
      </button>
    </div>
  </div>

  <nav class="nav">
    <!-- 标识区 -->
    <div class="nav-logo">
      <div class="logo-mark">
        <span class="dot dot-a"></span>
        <span class="dot dot-b"></span>
        <span class="dot dot-c"></span>
      </div>
      <div class="logo-text">
        <span class="logo-name">DOT</span>
        <span class="logo-sub">EVM DApp</span>
      </div>
    </div>

    <!-- 钱包状态简版入口 -->
    <div class="nav-wallet" @click="openWalletPanel">
      <div v-if="wallet.isConnected" class="wallet-connected">
        <span class="w-dot"></span>
        <span class="w-addr">{{ shortAddr }}</span>
        <span class="w-bal" v-if="wallet.balance">{{ wallet.balance }} <em>{{ wallet.balanceSymbol }}</em></span>
      </div>
      <div v-else class="wallet-disconnected">
        <span class="w-icon">🔗</span>
        <span>{{ t('wallet.connect') }}</span>
      </div>
    </div>

    <!-- 当前网络 -->
    <div class="nav-network" v-if="wallet.isConnected">
      <div class="net-label">{{ t('wallet.network') }}</div>
      <div class="net-row">
        <span :class="['badge', chain ? 'badge-pink' : 'badge-yellow']">
          {{ networkName }}
        </span>
        <span class="badge" :class="networkKindClass">{{ networkKindLabel }}</span>
      </div>
      <select class="net-select" @change="e => handleSwitchNetwork(+e.target.value)">
        <option value="">{{ t('wallet.switchNetwork') }}</option>
        <option v-for="c in supportedChains" :key="c.id" :value="c.id">
          {{ c.name }}{{ c.testnet ? ' ✦' : '' }}
        </option>
      </select>
    </div>

    <!-- 导航入口 -->
    <div class="nav-links">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        :title="t(item.labelKey)"
        class="nav-link"
      >
        <span class="nl-icon">{{ item.icon }}</span>
        <span class="nl-label">{{ t(item.labelKey) }}</span>
        <span class="nl-active-bar"></span>
      </RouterLink>
    </div>

    <!-- 底部语言切换 -->
    
    <div class="nav-footer">
      <button class="btn-lang" @click="toggleLang()">
        {{ t('common.switchLang') }}
      </button>
    </div>
    

    <!-- 钱包弹窗 -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="!hasAppKitWalletSelector && showWalletModal" class="modal-overlay" @click.self="showWalletModal = false">
          <div class="modal-box">
            <div class="modal-head">
              <h3>{{ wallet.isConnected ? t('wallet.connected') : t('wallet.selectWallet') }}</h3>
              <button class="modal-close" @click="showWalletModal = false">✕</button>
            </div>

            <!-- 已连接状态 -->
            <div v-if="wallet.isConnected" class="modal-connected">
              <div class="mc-addr">
                <span class="label">{{ t('wallet.address') }}</span>
                <div class="mc-addr-row">
                  <code class="mono mc-addr-val">{{ wallet.address }}</code>
                  <button class="btn btn-sm btn-ghost" @click="copyAddr">⎘</button>
                </div>
              </div>
              <div class="mc-balance">
                <span class="label">{{ t('wallet.balance') }}</span>
                <span class="mc-bal-val">{{ wallet.balance ?? '—' }} {{ wallet.balanceSymbol }}</span>
              </div>
              <div class="mc-actions">
                <button class="btn btn-secondary" @click="handleRefreshWallet">
                  {{ t('wallet.refresh') }}
                </button>
                <button class="btn btn-danger" @click="handleDisconnect">
                  {{ t('wallet.disconnect') }}
                </button>
              </div>
            </div>

            <!-- 钱包选择列表 -->
            <div v-else class="modal-select">
              <button
                v-for="w in walletOptions"
                :key="w.id"
                :class="['wallet-option', { 'wallet-option-disabled': w.disabled }]"
                :disabled="loading || w.disabled"
                @click="handleConnect(w.id)"
              >
                <span class="wo-icon">{{ w.icon }}</span>
                <div class="wo-info">
                  <span class="wo-name">{{ w.name }}</span>
                  <span class="wo-desc">{{ w.desc }}</span>
                </div>
                <span class="wo-arrow">→</span>
              </button>
              <p v-if="error" class="modal-error">⚠ {{ error }}</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { openWalletSelector, HAS_APPKIT_PROJECT_ID } from '@/appkit/index.js'
import { toggleLang } from '@/i18n/index.js'
import { useWallet } from '@/composables/useWallet.js'
import { useToast }  from '@/composables/useToast.js'
import { HAS_WALLETCONNECT_PROJECT_ID } from '@/walletConnectors.js'

const { t }   = useI18n()
const { wallet, chain, networkState, shortAddr, supportedChains, loading, error,
        connectWallet, disconnectWallet, switchNetwork, refreshWalletState } = useWallet()
const { success, error: toastError } = useToast()

const showWalletModal = ref(false)
const hasAppKitWalletSelector = HAS_APPKIT_PROJECT_ID

// 侧边栏是用户判断当前链的第一入口，所以未知链必须明确标出来。
const networkName = computed(() => {
  if (chain.value) return chain.value.name
  if (wallet.value.chainId === null || wallet.value.chainId === undefined) return t('wallet.unknownNetwork')
  return t('wallet.unsupportedNetwork', { id: wallet.value.chainId })
})

// 网络类型必须跟随当前 chainId，不能把未知链误标成主网。
const networkKindLabel = computed(() => {
  if (!networkState.value.isSupported) return t('wallet.unsupported')
  return networkState.value.kind === 'testnet' ? t('dashboard.testnet') : t('dashboard.mainnet')
})

// 徽标颜色和网络类型保持同源，避免文案和颜色表达互相打架。
const networkKindClass = computed(() => {
  if (!networkState.value.isSupported) return 'badge-gray'
  return networkState.value.kind === 'testnet' ? 'badge-yellow' : 'badge-cyan'
})

// 移动端顶部只放最关键的钱包状态，避免占用过多首屏空间。
const mobileWalletTitle = computed(() =>
  wallet.value.isConnected ? shortAddr.value : t('wallet.connect')
)

// 第二行展示网络或安装提示，用户不用打开弹窗也能知道当前状态。
const mobileWalletMeta = computed(() => {
  if (!wallet.value.isConnected) {
    return hasAppKitWalletSelector ? t('wallet.noWalletSelector') : t('wallet.noWalletBrowser')
  }
  const balance = wallet.value.balance ? `${wallet.value.balance} ${wallet.value.balanceSymbol}` : t('wallet.connected')
  return `${networkName.value} · ${balance}`
})

const navItems = [
  { to: '/',         icon: '◈', labelKey: 'nav.dashboard' },
  { to: '/deploy',   icon: '🚀', labelKey: 'nav.deploy'    },
  { to: '/interact', icon: '⚡', labelKey: 'nav.interact'  },
  { to: '/transfer', icon: '💸', labelKey: 'nav.transfer'  },
]

const walletOptions = computed(() => [
  { id: 'metaMask',  icon: '🦊', name: t('wallet.metamask'),  desc: t('wallet.metamaskDesc')  },
  { id: 'talisman',  icon: '🌐', name: t('wallet.talisman'),  desc: t('wallet.talismanDesc')  },
  { id: 'subwallet', icon: '🔵', name: t('wallet.subwallet'), desc: t('wallet.subwalletDesc') },
  {
    id: 'walletConnect',
    icon: '▣',
    name: t('wallet.walletConnect'),
    desc: HAS_WALLETCONNECT_PROJECT_ID ? t('wallet.walletConnectDesc') : t('wallet.walletConnectMissing'),
    disabled: !HAS_WALLETCONNECT_PROJECT_ID,
  },
  { id: 'injected',  icon: '💳', name: t('wallet.injected'),  desc: t('wallet.injectedDesc')  },
])

// 配了 AppKit project id 时优先走官方钱包选择器；没配时再回退到当前本地弹窗。
async function openWalletPanel() {
  try {
    if (hasAppKitWalletSelector) {
      const opened = await openWalletSelector()
      if (opened) return
    }
  } catch (e) {
    toastError(t('toast.connectFailed', { msg: e.message }))
  }
  showWalletModal.value = true
}

// 钱包连接完成后关闭弹窗，让用户立刻回到当前页面继续操作。
async function handleConnect(id) {
  try {
    await connectWallet(id)
    success(t('toast.walletConnected'))
    showWalletModal.value = false
  } catch (e) {
    toastError(t('toast.connectFailed', { msg: e.message }))
  }
}

function handleWalletPanelRequest() {
  openWalletPanel()
}

// 断开连接会清理共享钱包状态，弹窗也要同步关闭。
async function handleDisconnect() {
  await disconnectWallet()
  success(t('toast.walletDisconnected'))
  showWalletModal.value = false
}

// 弹窗里的刷新也重新读取钱包快照，避免只刷新余额导致网络信息落后。
async function handleRefreshWallet() {
  await refreshWalletState()
}

// 网络切换只允许选择项目配置过的链，失败时保留钱包原状态给用户重试。
async function handleSwitchNetwork(chainId) {
  if (!chainId) return
  try {
    await switchNetwork(chainId)
    const name = supportedChains.find(c => c.id === chainId)?.name ?? chainId
    success(t('toast.networkSwitched', { name }))
  } catch (e) {
    toastError(e.message)
  }
}

// 复制使用完整地址，界面上的短地址只负责展示。
function copyAddr() {
  navigator.clipboard.writeText(wallet.value.address ?? '')
  success(t('toast.copySuccess'))
}

onMounted(() => {
  // 让仪表盘等外部按钮也能复用导航这边的钱包入口，避免每个页面自己维护一套连接逻辑。
  window.addEventListener('wallet-panel:open', handleWalletPanelRequest)
})

onUnmounted(() => {
  window.removeEventListener('wallet-panel:open', handleWalletPanelRequest)
})
</script>

<style scoped>
/* 移动端钱包入口 */
.mobile-wallet-bar {
  display: none;
}

.tablet-wallet-bar {
  display: none;
}

.mobile-wallet-btn,
.mobile-lang-btn,
.tablet-wallet-btn,
.tablet-lang-btn,
.tablet-net-select {
  font-family: var(--font-ui);
}

.mobile-wallet-btn {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: .65rem;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--t1);
  padding: .45rem .7rem;
  cursor: pointer;
}

.mobile-wallet-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mobile-wallet-dot.on {
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
}
.mobile-wallet-dot.off {
  background: var(--yellow);
  box-shadow: 0 0 8px rgba(245,197,24,.35);
}

.mobile-wallet-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}
.mobile-wallet-title {
  max-width: 100%;
  font-size: .82rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-wallet-meta {
  max-width: 100%;
  margin-top: .16rem;
  font-size: .66rem;
  color: var(--t3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mobile-lang-btn {
  flex: 0 0 auto;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--t2);
  padding: 0 .7rem;
  font-size: .72rem;
  cursor: pointer;
}

.tablet-wallet-btn {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: .7rem;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--r);
  color: var(--t1);
  padding: .55rem .85rem;
  cursor: pointer;
}

.tablet-wallet-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tablet-wallet-dot.on {
  background: var(--cyan);
  box-shadow: 0 0 8px var(--cyan);
}
.tablet-wallet-dot.off {
  background: var(--yellow);
  box-shadow: 0 0 8px rgba(245,197,24,.35);
}

.tablet-wallet-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.15;
}
.tablet-wallet-title {
  max-width: 100%;
  font-size: .84rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tablet-wallet-meta {
  max-width: 100%;
  margin-top: .16rem;
  font-size: .68rem;
  color: var(--t2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tablet-wallet-actions {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex: 0 0 auto;
}

.tablet-net-select {
  min-width: 164px;
  max-width: 220px;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--t2);
  font-family: var(--font-mono);
  font-size: .72rem;
  padding: .55rem .65rem;
  outline: none;
  cursor: pointer;
}
.tablet-net-select:focus {
  border-color: var(--pink);
}

.tablet-lang-btn {
  flex: 0 0 auto;
  background: var(--bg-3);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  color: var(--t2);
  padding: .55rem .8rem;
  font-size: .72rem;
  cursor: pointer;
}

/* 导航外壳 */
.nav {
  width: var(--nav-w);
  min-height: 100vh;
  position: fixed; left: 0; top: 0;
  display: flex; flex-direction: column;
  background: var(--bg-1);
  border-right: 1px solid var(--border);
  padding: 0;
  z-index: 200;
}

/* 标识区 */
.nav-logo {
  display: flex; align-items: center; gap: .8rem;
  padding: 1.2rem 1.2rem 1rem;
  border-bottom: 1px solid var(--border);
}
.logo-mark {
  display: grid; grid-template-columns: 1fr 1fr; gap: 3px;
  width: 28px; height: 28px;
}
.dot {
  border-radius: 50%; display: block;
}
.dot-a { background: var(--pink);  width: 10px; height: 10px; grid-column: 1/2; grid-row: 1; box-shadow: 0 0 8px var(--pink-glow); }
.dot-b { background: var(--cyan);  width: 10px; height: 10px; grid-column: 2/3; grid-row: 1; }
.dot-c { background: var(--pink);  width: 10px; height: 10px; grid-column: 1/3; grid-row: 2; opacity: .45; }
.logo-name { font-size: 1.1rem; font-weight: 800; letter-spacing: .04em; color: var(--t1); line-height: 1; }
.logo-sub  { font-size: .6rem;  color: var(--t3); letter-spacing: .08em; text-transform: uppercase; line-height: 1; }
.logo-text { display: flex; flex-direction: column; gap: 2px; }

/* 钱包简版状态 */
.nav-wallet {
  margin: .8rem .8rem .4rem;
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--r); padding: .7rem .9rem;
  cursor: pointer; transition: border-color .2s;
}
.nav-wallet:hover { border-color: var(--border-h); }
.wallet-connected { display: flex; flex-direction: column; gap: .25rem; }
.w-dot {
  display: inline-block; width: 7px; height: 7px;
  border-radius: 50%; background: var(--cyan);
  box-shadow: 0 0 6px var(--cyan); margin-bottom: .2rem;
}
.w-addr { font-family: var(--font-mono); font-size: .72rem; color: var(--t2); }
.w-bal  { font-size: .85rem; font-weight: 700; color: var(--cyan); }
.w-bal em { font-style: normal; font-size: .68rem; color: var(--t3); margin-left: .2rem; }
.wallet-disconnected {
  display: flex; align-items: center; gap: .5rem;
  font-size: .8rem; color: var(--t2);
}
.w-icon { font-size: 1rem; }

/* 网络切换区 */
.nav-network {
  padding: .5rem .9rem .6rem;
  border-bottom: 1px solid var(--border);
}
.net-label { font-size: .65rem; color: var(--t3); text-transform: uppercase; letter-spacing: .07em; margin-bottom: .35rem; }
.net-row { display: flex; gap: .35rem; flex-wrap: wrap; margin-bottom: .4rem; }
.net-select {
  width: 100%;
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--r-sm); color: var(--t2);
  font-family: var(--font-mono); font-size: .7rem;
  padding: .35rem .5rem; cursor: pointer; outline: none;
}
.net-select:focus { border-color: var(--pink); }

/* 导航链接 */
.nav-links {
  flex: 1; display: flex; flex-direction: column;
  gap: .15rem; padding: .8rem .6rem 0;
}
.nav-link {
  display: flex; align-items: center; gap: .7rem;
  padding: .6rem .75rem; border-radius: var(--r-sm);
  color: var(--t2); text-decoration: none;
  font-size: .84rem; font-weight: 500;
  position: relative; transition: all .18s;
}
.nav-link:hover { background: var(--bg-3); color: var(--t1); }
.nav-link.router-link-active {
  background: var(--pink-dim); color: var(--pink);
}
.nav-link.router-link-active .nl-active-bar {
  position: absolute; right: 0; top: 20%; bottom: 20%;
  width: 3px; background: var(--pink); border-radius: 2px;
  box-shadow: 0 0 8px var(--pink);
}
.nl-icon  { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; }
.nl-label { flex: 1; }
.nav-link-ext { opacity: .6; }

/* 底部操作 */
.nav-footer {
  border-top: 1px solid var(--border);
  padding: .7rem .6rem;
  display: flex; flex-direction: column; gap: .3rem;
}
.btn-lang {
  display: block; width: 100%;
  background: var(--bg-3); border: 1px solid var(--border);
  border-radius: var(--r-sm); color: var(--t2);
  font-family: var(--font-mono); font-size: .72rem;
  padding: .4rem; cursor: pointer; transition: all .18s;
  letter-spacing: .08em;
}
.btn-lang:hover { border-color: var(--pink); color: var(--pink); }

/* 弹窗 */
.modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: var(--r-lg); width: min(420px, 95vw);
  box-shadow: 0 32px 80px rgba(0,0,0,.6);
  overflow: hidden;
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--border);
}
.modal-head h3 { font-size: 1rem; }
.modal-close {
  background: none; border: none; color: var(--t3);
  font-size: 1rem; cursor: pointer;
  transition: color .15s;
}
.modal-close:hover { color: var(--t1); }

/* 已连接状态 */
.modal-connected { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.mc-addr { }
.mc-addr-row { display: flex; align-items: center; gap: .5rem; margin-top: .4rem; }
.mc-addr-val { font-size: .7rem; color: var(--t2); word-break: break-all; flex: 1; }
.mc-balance { display: flex; align-items: center; gap: .7rem; flex-wrap: wrap; }
.mc-balance .label { margin-bottom: 0; }
.mc-bal-val { font-size: 1rem; font-weight: 700; color: var(--cyan); flex: 1; }
.mc-actions { display: flex; gap: .7rem; }

/* 钱包选择 */
.modal-select { padding: 1rem 1.2rem 1.2rem; display: flex; flex-direction: column; gap: .5rem; }
.wallet-option {
  display: flex; align-items: center; gap: .9rem;
  padding: .85rem 1rem; border-radius: var(--r);
  background: var(--bg-3); border: 1px solid var(--border);
  cursor: pointer; transition: all .18s; text-align: left;
}
.wallet-option:hover { border-color: var(--pink); background: var(--pink-dim); }
.wallet-option:disabled { opacity: .4; }
.wallet-option-disabled { cursor: not-allowed; }
.wo-icon { font-size: 1.4rem; flex-shrink: 0; }
.wo-info { flex: 1; }
.wo-name { display: block; font-size: .88rem; font-weight: 600; color: var(--t1); }
.wo-desc { display: block; font-size: .72rem; color: var(--t3); margin-top: 2px; }
.wo-arrow { color: var(--t3); transition: color .15s; }
.wallet-option:hover .wo-arrow { color: var(--pink); }

.modal-error {
  font-size: .78rem; color: var(--red);
  background: var(--red-dim); border: 1px solid rgba(255,69,96,.2);
  border-radius: var(--r-sm); padding: .6rem .9rem;
}

/* 弹窗过渡 */
.modal-enter-active, .modal-leave-active { transition: all .2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box, .modal-leave-to .modal-box {
  transform: scale(.95) translateY(10px);
}

@media (max-width: 900px) and (min-width: 641px) {
  /* 平板态改成“左侧导轨 + 顶部工具条”，横向空间优先让给主内容。 */
  .tablet-wallet-bar {
    position: fixed;
    top: 0;
    left: var(--nav-w);
    right: 0;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    padding: .85rem 1rem;
    background: rgba(12,15,26,.96);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    z-index: 210;
  }

  .nav {
    width: var(--nav-w);
  }

  .nav-logo {
    justify-content: center;
    padding: 1rem .4rem .9rem;
  }
  .logo-text,
  .nav-wallet,
  .nav-network,
  .nav-footer {
    display: none;
  }

  .nav-links {
    padding: .8rem .5rem 0;
    gap: .35rem;
  }

  .nav-link {
    justify-content: center;
    padding: .7rem .2rem;
    min-height: 46px;
    border-radius: var(--r);
  }
  .nav-link.router-link-active .nl-active-bar {
    right: 6px;
  }
  .nl-icon {
    width: auto;
    font-size: 1.05rem;
  }
  .nl-label {
    display: none;
  }
}

@media (max-width: 640px) {
  .mobile-wallet-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    display: flex;
    gap: .55rem;
    align-items: center;
    padding: .45rem .75rem;
    background: rgba(12,15,26,.96);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    z-index: 220;
  }

  .nav {
    bottom: 0; top: auto; right: 0;
    width: 100%; height: 60px;
    flex-direction: row;
    border-right: none; border-top: 1px solid var(--border);
    min-height: unset;
    overflow: hidden;
  }
  .nav-logo, .nav-wallet, .nav-network, .nav-footer { display: none; }
  .nav-links { flex-direction: row; padding: 0; gap: 0; flex: 1; }
  .nav-link {
    flex: 1; flex-direction: column; gap: .15rem;
    justify-content: center; padding: .4rem .2rem;
    font-size: .62rem; border-radius: 0;
  }
  .nl-icon { font-size: .9rem; width: auto; }
  .nav-link.router-link-active .nl-active-bar {
    top: 0; left: 20%; right: 20%; bottom: auto;
    height: 2px; width: auto;
  }
  .modal-overlay {
    align-items: flex-end;
    padding: .8rem;
  }
  .modal-box {
    width: 100%;
    max-height: calc(100vh - 96px);
    overflow: auto;
  }
  .modal-head {
    padding: 1rem 1.1rem;
  }
  .modal-connected,
  .modal-select {
    padding: 1rem;
  }
  .mc-actions {
    flex-direction: column;
  }
  .mc-actions .btn {
    justify-content: center;
    width: 100%;
  }
}
</style>
