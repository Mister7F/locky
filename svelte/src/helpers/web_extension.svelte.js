const Store = () => {
    let sendCredentials = $state(null)
    let savePassword = $state(null)
    let inWebExtension = $state(null)
    let onWalletOpen = $state(null)

    return {
        get sendCredentials() {
            return sendCredentials
        },
        set sendCredentials(v) {
            if (inWebExtension) {
                sendCredentials = v
            }
        },
        get savePassword() {
            return savePassword
        },
        set savePassword(v) {
            if (inWebExtension) {
                savePassword = v
            }
        },
        get inWebExtension() {
            return inWebExtension
        },
        set inWebExtension(v) {
            inWebExtension = v
        },
        get onWalletOpen() {
            return onWalletOpen
        },
        set onWalletOpen(wallet) {
            if (inWebExtension) {
                onWalletOpen = wallet
            }
        },
    }
}

export default Store()
