const Store = () => {
    let sendCredentials = $state(null)
    let savePassword = $state(null)
    let inWebExtension = $state(null)

    return {
        get sendCredentials() {
            return sendCredentials
        },
        set sendCredentials(v) {
            sendCredentials = v
        },
        get savePassword() {
            return savePassword
        },
        set savePassword(v) {
            savePassword = v
        },
        get inWebExtension() {
            return inWebExtension
        },
        set inWebExtension(v) {
            inWebExtension = v
        },
    }
}

export default Store()
