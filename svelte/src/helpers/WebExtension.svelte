<script>
    import Dialog from './Dialog.svelte'
    import Button from './Button.svelte'
    import WebExtension from './web_extension.svelte.js'

    import {
        fromHex,
        hex,
        sleep,
        fromBytes,
        toBytes,
        copyValue,
        cleanSearchValue,
    } from './utils.js'
    import { encryptAES, decryptAES, getTotpCode } from './crypto.js'
    import * as api from '../application/api.js'
    import { normalizeHost } from '../helpers/utils.js'

    let pluginKey = null
    let pluginOrigin = null

    let {
        wallet = $bindable({}),
        searchText = $bindable(''),
        locked = $bindable(false),

        onnotify,
    } = $props()

    let currentTabHost = $state(null)

    let confirmationDialogOpen = $state(false)
    let accountHost = $state()
    let account = null
    let newWebExtensionKeyDialogMessage = $state('')
    let newWebExtensionKeyDialogOrigin = $state('')
    let newWebExtensionKeyDialogKeyHash = $state('')
    let newWebExtensionKeyDialogOk = $state(null)

    /**
     * Parse the URL to check if a key is present, and ask to save it.
     */
    async function initiateWebExtention() {
        window.addEventListener('message', async (event) => {
            if (
                !event.origin.startsWith('moz-extension://') &&
                !event.origin.startsWith('chrome-extension://')
            ) {
                console.error('Received message from invalid origin', event)
                return
            }
            if (!event.isTrusted) {
                console.error('Received message from un-trusted event')
                return
            }

            // Force basic types
            const eventData = JSON.parse(JSON.stringify(event.data))

            const newPluginKey = fromHex(eventData.pluginKey)
            if (!newPluginKey?.byteLength) {
                return
            }
            let ok = false
            let inExtension = false
            const newPluginKeyHash = hex(
                await crypto.subtle.digest('SHA-256', newPluginKey)
            )
            const existingPluginKeyHash = localStorage.getItem('pluginKeyHash')
            const existingPluginOrigin = localStorage.getItem('pluginOrigin')

            if (
                existingPluginKeyHash?.length &&
                newPluginKeyHash === existingPluginKeyHash &&
                existingPluginOrigin === event.origin
            ) {
                pluginKey = newPluginKey
                pluginOrigin = event.origin
                WebExtension.inWebExtension = true
                currentTabHost = normalizeHost(eventData.currentUrl)

                // The extension is already loaded, decrypt it and unlock the wallet
                if (eventData.encryptedPassword?.length) {
                    const encryptedPassword = fromHex(
                        eventData.encryptedPassword
                    )
                    const pt = await decryptAES(
                        encryptedPassword,
                        getMasterPasswordKey()
                    )
                    const { password, key } = JSON.parse(fromBytes(pt))
                    await unlock(
                        password,
                        new Uint8Array(fromHex(key)),
                        currentTabHost
                    )
                }
                return
            }

            await sleep(200) // Let the application loads before showing the alert
            newWebExtensionKeyDialogOrigin = event.origin
            newWebExtensionKeyDialogKeyHash = newPluginKeyHash
            if (existingPluginKeyHash?.length || existingPluginOrigin?.length) {
                newWebExtensionKeyDialogMessage =
                    'Replace the existing extension key with a new one?'
            } else {
                newWebExtensionKeyDialogMessage = 'Save the web extension key?'
            }
            newWebExtensionKeyDialogOk = () => {
                pluginKey = newPluginKey
                pluginOrigin = event.origin
                localStorage.setItem('pluginKeyHash', newPluginKeyHash)
                localStorage.setItem('pluginOrigin', pluginOrigin)
                WebExtension.inWebExtension = true
                newWebExtensionKeyDialogOk = null
            }
        })

        // Ask plugin key
        await sleep(40) // for some reason, without that auto-unlock sometimes fail on Firefox
        window.parent.postMessage('IFRAME_READY', '*')
    }

    async function unlock(password, key, host) {
        // If we saved the password for the web extension, unlock the wallet
        const newWallet = await api.unlock(password, key)
        if (!newWallet || !password.length) {
            return
        }
        setSearch(newWallet)
        locked = false
        wallet = newWallet
    }

    function setSearch(wallet) {
        if (!currentTabHost || !wallet) {
            return
        }

        const walletText = JSON.stringify(
            wallet.accounts.map((a) => [
                cleanSearchValue(a.name),
                cleanSearchValue(a.url),
            ])
        )

        if (
            currentTabHost.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+(:[0-9]+)?$/)
        ) {
            // IP address
            if (walletText.includes(cleanSearchValue(currentTabHost))) {
                searchText = currentTabHost
            }
        } else {
            // Domain name
            let parts = currentTabHost.split('.')
            while (
                parts.length > 2 &&
                !walletText.includes(cleanSearchValue(parts.join('.')))
            ) {
                parts.shift()
            }
            if (
                parts.length &&
                !walletText.includes(cleanSearchValue(parts.join('.')))
            ) {
                parts = [parts[0]]
            }
            if (walletText.includes(cleanSearchValue(parts.join('.')))) {
                searchText = parts.join('.')
            }
        }
    }

    let _p = $derived.by(async () => {
        if (!WebExtension.savePassword) {
            return
        }
        await savePassword(...WebExtension.savePassword)
        WebExtension.savePassword = null
    })

    let _c = $derived.by(async () => {
        if (!WebExtension.sendCredentials) {
            return
        }
        await sendCredentials(WebExtension.sendCredentials)
        WebExtension.sendCredentials = null
    })

    let _s = $derived.by(() => {
        console.log(WebExtension.setSearch)
        if (!WebExtension.setSearch) {
            return
        }
        setSearch(WebExtension.setSearch)
        WebExtension.setSearch = null
    })

    async function sendCredentials(_account) {
        if (!WebExtension.inWebExtension) {
            onnotify('Web Extension is not installed')
            return
        }
        account = _account
        accountHost = normalizeHost(account.url)
        if (!accountHost || accountHost === currentTabHost) {
            onnotify(await _sendCredentials())
            return
        }
        confirmationDialogOpen = true
    }

    /**
     * Send the encrypted account credentials to the Web Extension popup.
     */
    async function _sendCredentials() {
        if (account.totp) {
            copyValue(getTotpCode(account.totp))
        }
        const event = {
            action: 'login',
            account: {
                login: account.login,
                password: account.password,
                url: account.url,
                totp: (await getTotpCode(account.totp)),
            },
        }
        return (await sendToWebExtension(event))
            ? `Credentials sent${account.totp ? 'and TOTP code copied' : ''}`
            : 'Configure the extension before using it'
    }

    /**
     * Save the password in the session storage of the Web Extension, encrypted so
     * - the data is removed when the browser is closed (storage.session)
     * - the data persist if we close the popup
     * - the web extension can not read it, since it does not have the key
     */
    async function savePassword(password, key) {
        if (!pluginKey?.byteLength) {
            return
        }

        const encryptedPassword = await encryptAES(
            toBytes(JSON.stringify({ password, key: hex(key) })),
            getMasterPasswordKey()
        )
        return await sendToWebExtension({
            action: 'savePassword',
            encryptedPassword: hex(encryptedPassword),
        })
    }

    /**
     * Key used to store the master password in the Web Extension session storage.
     */
    function getMasterPasswordKey() {
        if (!localStorage.getItem('masterPasswordKey')?.length) {
            localStorage.setItem('masterPasswordKey', hex(generateToken(32)))
        }
        return fromHex(localStorage.getItem('masterPasswordKey'))
    }

    function generateToken(size) {
        const token = new Uint8Array(size)
        window.crypto.getRandomValues(token)
        return token
    }

    async function sendToWebExtension(event) {
        if (!pluginKey?.byteLength) {
            return false
        }
        const ct = await encryptAES(toBytes(JSON.stringify(event)), pluginKey)
        window.parent.postMessage(ct, pluginOrigin)
        return true
    }

    $effect(initiateWebExtention)
</script>

<!-- Trick to make reactivity -->
<div {_p} {_c} {_s} style="display: none"></div>

<Dialog bind:open={confirmationDialogOpen} title="Are you sure ?">
    The current domain <b class="host">{WebExtension.currentTabHost}</b>
    does not match the URL in your wallet <b class="host">{accountHost}</b>, are
    you sure you are not phished?

    {#snippet actions()}
        <Button
            onclick={() => (confirmationDialogOpen = false)}
            color="secondary"
            variant="outlined"
        >
            No
        </Button>
        <Button
            onclick={async () => {
                confirmationDialogOpen = false
                onnotify(await _sendCredentials(WebExtension.sendCredentials))
            }}
            color="primary"
        >
            Yes
        </Button>
    {/snippet}
</Dialog>

<Dialog bind:open={newWebExtensionKeyDialogOk} title="Are you sure ?">
    <div class="dialog_message">
        {newWebExtensionKeyDialogMessage}
        <br />
        <br />
        Origin:
        <span>{newWebExtensionKeyDialogOrigin}</span>
        <br />
        <br />
        h(key):
        <span>{newWebExtensionKeyDialogKeyHash}</span>
    </div>

    {#snippet actions()}
        <Button
            onclick={() => (newWebExtensionKeyDialogOk = null)}
            color="secondary"
            variant="outlined"
        >
            No
        </Button>
        <Button onclick={newWebExtensionKeyDialogOk} color="primary">
            Yes
        </Button>
    {/snippet}
</Dialog>

<style>
    .host {
        color: var(--error);
    }
    .dialog_message {
        color: var(--on-primary);
        overflow: hidden;
        overflow-wrap: anywhere;
    }
    .dialog_message span {
        color: var(--error);
        display: inline-block;
    }
</style>
