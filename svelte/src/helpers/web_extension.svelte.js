const Store = () => {
    let sendCredentials = $state(null)
    let savePassword = $state(null)
    let inWebExtension = $state(null)
    let setSearch = $state(null)

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
        get setSearch() {
            return setSearch
        },
        set setSearch(v) {
            if (inWebExtension) {
                setSearch = v
            }
        },
    }
}

export default Store()
