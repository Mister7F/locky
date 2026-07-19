document.body.onload = () => {
    const iframe = document.querySelector('iframe')
    const storedUrl = localStorage.getItem('lockyUrl')
    if (isWalletUrlAllowed(storedUrl)) {
        iframe.src = storedUrl
    }

    document.querySelector('.error-message a').href =
        chrome.runtime.getURL('/options.html')

    chrome.storage.sync.get('lockyUrl').then((value) => {
        const newUrl = value.lockyUrl || ''
        if (!isWalletUrlAllowed(newUrl)) {
            document.querySelector('.error-message').classList.add('show')
            iframe.remove()
            return
        }

        const currentUrl = localStorage.getItem('lockyUrl')
        if (newUrl === currentUrl) {
            return
        }
        if (!currentUrl) {
            localStorage.setItem('lockyUrl', newUrl)
            iframe.src = newUrl
            return
        }

        // If the URL of the wallet changed because of browser synchronization, ask to confirm the change
        iframe.classList.remove('show')
        document.querySelector('.confirm').classList.add('show')
        document.querySelector('.from_url').innerText = currentUrl
        document.querySelector('.to_url').innerText = newUrl
        document.querySelector('.yes').addEventListener('click', () => {
            document.querySelector('.confirm').classList.remove('show')
            localStorage.setItem('lockyUrl', newUrl)
            iframe.src = newUrl
            iframe.classList.add('show')
        })
        document.querySelector('.no').addEventListener('click', () => {
            window.open(chrome.runtime.getURL('/options.html'))
        })
    })

    let checkedTab = null

    // each time we open the popup, we generate a new random `channelId`
    // we increment `lastSequence` for each call to prevent replay attack
    let channelId = null
    let lastSequence = 0

    /**
     * Return the key used to communicate with the `lockyUrl`.
     */
    async function getKey(walletUrl) {
        if (!localStorage.getItem('extensionMasterKey')?.length) {
            localStorage.setItem('extensionMasterKey', hex(await generateKey()))
        }
        const masterKey = new Uint8Array(
            fromHex(localStorage.getItem('extensionMasterKey'))
        )
        return await deriveKeyHKDF(
            masterKey,
            `locky-wallet-key-v1\0${getWalletScope(walletUrl)}`
        )
    }

    window.addEventListener('message', async (ev) => {
        const lockyUrl = localStorage.getItem('lockyUrl')
        if (!lockyUrl) {
            return
        }
        const lockyOrigin = new URL(lockyUrl).origin
        if (ev.origin !== lockyOrigin) {
            console.error('Wrong origin: ', ev.origin)
            return
        }
        if (!ev.isTrusted || ev.source !== iframe.contentWindow) {
            console.error('Received message from un-trusted event')
            return
        }

        if (ev.data === 'IFRAME_READY') {
            // Send our key, and the encrypted password if it has been saved
            const pluginKey = await getKey(lockyUrl)
            const storage = await chrome.storage.session.get()
            const tab = await getCurrentTab()
            checkedTab = { id: tab.id, url: tab.url }
            channelId = hex(window.crypto.getRandomValues(new Uint8Array(16)))
            lastSequence = 0
            iframe.contentWindow.postMessage(
                {
                    pluginKey: hex(pluginKey),
                    channelId,
                    encryptedPassword: storage.encryptedPassword,
                    // Send information about the current tab
                    currentUrl: tab.url,
                },
                lockyOrigin // target only the locky origin
            )
            return
        }

        // Decrypt using the shared key we have with Locky
        const key = await getKey(lockyUrl)
        const pt = await decryptAESGCM(new Uint8Array(ev.data), key)
        if (!pt) {
            console.error('Web Extension: invalid authenticated message')
            return
        }

        let message
        try {
            message = JSON.parse(new TextDecoder().decode(pt))
        } catch {
            console.error('Web Extension: malformed message')
            return
        }

        if (
            !channelId ||
            message.channelId !== channelId ||
            !Number.isSafeInteger(message.sequence) ||
            message.sequence <= lastSequence ||
            !message.event ||
            typeof message.event !== 'object'
        ) {
            console.error('Web Extension: invalid or replayed message')
            return
        }
        lastSequence = message.sequence
        const event = message.event

        if (event.action === 'login') {
            // Check that the tab didn't redirect between now and the check
            const tab = await chrome.tabs.get(checkedTab.id).catch(() => null)
            if (
                tab &&
                new URL(tab.url).origin === new URL(checkedTab.url).origin
            ) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'login',
                    account: event.account,
                })
            }
        } else if (event.action === 'savePassword') {
            await chrome.storage.session.set({
                encryptedPassword: event.encryptedPassword,
            })
            console.debug('Password saved in the plugin session storage')
        } else {
            console.error('Web Extension: wrong action', event)
        }
    })

    async function getCurrentTab() {
        return new Promise(function (resolve, reject) {
            chrome.tabs.query(
                {
                    active: true, // Select active tabs
                    lastFocusedWindow: true, // In the current window
                },
                function (tabs) {
                    resolve(tabs[0])
                }
            )
        })
    }
}

function isWalletUrlAllowed(value) {
    if (!value) {
        return false
    }

    let url
    try {
        url = new URL(value)
    } catch {
        return false
    }

    // Credentials make prefix-based URL checks ambiguous and have no valid use
    // in a wallet endpoint.
    if (url.username || url.password) {
        return false
    }

    if (url.protocol === 'https:') {
        return true
    }

    return (
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
}

function getWalletScope(value) {
    const url = new URL(value)
    // Remove ending `/`
    const pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.origin + pathname
}
