import { fromHex, hex, sleep, fromBytes, toBytes, copyValue } from './utils.js'
import { encryptAES, decryptAES, getTotpCode } from './crypto.js'
import * as api from '../application/api.js'
import { normalizeHost } from '../helpers/utils.js'

let pluginKey = null
let pluginOrigin = null

/**
 * Parse the URL to check if a key is present, and ask to save it.
 */
export async function initiateWebExtention(unlock) {
    if (window.parent === window) {
        // Not in an iframe
        return
    }

    window.addEventListener('message', async (event) => {
        if (
            !event.origin.startsWith('moz-extension://') &&
            !event.origin.startsWith('chrome-extension://')
        ) {
            console.error('Received message from invalid origin', event)
            return
        }
        if (!event.isTrusted || event.source !== window.parent) {
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
            window.inWebExtension = true
            window.currentTabHost = normalizeHost(eventData.currentUrl)

            // The extension is already loaded, decrypt it and unlock the wallet
            if (eventData.encryptedPassword?.length) {
                const encryptedPassword = fromHex(eventData.encryptedPassword)
                const pt = await decryptAES(
                    encryptedPassword,
                    getMasterPasswordKey()
                )
                const { password, key } = JSON.parse(fromBytes(pt))
                await unlock(
                    password,
                    new Uint8Array(fromHex(key)),
                    window.currentTabHost
                )
            }
            return
        }

        await sleep(200) // Let the application loads before showing the alert
        if (existingPluginKeyHash?.length || existingPluginOrigin?.length) {
            ok = confirm(
                `Replace the existing extension key with a new one? \nOrigin: ${event.origin}\nh(key): ${newPluginKeyHash}`
            )
        } else {
            ok = confirm(
                `Save the web extension key? \nOrigin: ${event.origin}\nh(key): ${newPluginKeyHash}`
            )
        }
        if (ok) {
            pluginKey = newPluginKey
            pluginOrigin = event.origin
            localStorage.setItem('pluginKeyHash', newPluginKeyHash)
            localStorage.setItem('pluginOrigin', pluginOrigin)
            window.inWebExtension = true
        }
    })

    // Ask plugin key
    window.parent.postMessage('IFRAME_READY', '*')
}

/**
 * Send the encrypted account credentials to the Web Extension popup.
 */
export async function sendCredentials(account) {
    const event = {
        action: 'login',
        account: {
            login: account.login,
            password: account.password,
            url: account.url,
        },
    }
    if (account.totp) {
        copyValue((await getTotpCode(account.totp)).replace(' ', ''))
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
export async function savePassword(password, key) {
    if (!pluginKey?.byteLength) {
        return
    }

    const encryptedPassword = await encryptAES(
        toBytes(JSON.stringify({ password, key: hex(key) })),
        getMasterPasswordKey()
    )
    const ok = await sendToWebExtension({
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
