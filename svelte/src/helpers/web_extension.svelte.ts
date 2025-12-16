import Account from '../models/account.ts'
import Wallet from '../models/wallet.ts'

type StoreShape = {
    inWebExtension: boolean
}

const Store = (): StoreShape => {
    let inWebExtension = $state<boolean>(false)

    return {
        get inWebExtension() {
            return inWebExtension
        },
        set inWebExtension(v) {
            inWebExtension = v
        },
    }
}

export default Store()

export const eventBus = new EventTarget()

export function sendCredentials(account: Account) {
    const event = new CustomEvent('extension-send-credentials', {
        detail: account,
    })
    eventBus.dispatchEvent(event)
}

export function savePassword(password: string, key: Uint8Array | null) {
    const event = new CustomEvent('extension-save-password', {
        detail: { password, key },
    })
    eventBus.dispatchEvent(event)
}

export function walletOpened(wallet: Wallet) {
    const event = new CustomEvent('extension-wallet-opened', {
        detail: wallet,
    })
    eventBus.dispatchEvent(event)
}
