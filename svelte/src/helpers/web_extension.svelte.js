const Store = () => {
    let inWebExtension = $state(null)

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

export function sendCredentials(account) {
    const event = new CustomEvent('extension-send-credentials', {
        detail: account,
    })
    eventBus.dispatchEvent(event)
}

export function savePassword(password, key) {
    const event = new CustomEvent('extension-save-password', {
        detail: { password, key },
    })
    eventBus.dispatchEvent(event)
}

export function walletOpened(wallet) {
    const event = new CustomEvent('extension-wallet-opened', {
        detail: wallet,
    })
    eventBus.dispatchEvent(event)
}
