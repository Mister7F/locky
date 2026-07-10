document.body.onload = () => {
    const iframe = document.querySelector('iframe')
    iframe.src = localStorage.getItem('lockyUrl')

    document.querySelector('.error-message a').href =
        chrome.runtime.getURL('/options.html')

    chrome.storage.sync.get('lockyUrl').then((value) => {
        const newUrl = value.lockyUrl || ''
        if (
            !newUrl.startsWith('https://') &&
            !newUrl.startsWith('http://127.0.0.1:') &&
            !newUrl.startsWith('http://localhost:')
        ) {
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

    /**
     * The key is used to encrypt what store in the SW, and to communicate with postMessage
     */
    async function getKey() {
        if (!localStorage.getItem('encryptionKey')?.length) {
            localStorage.setItem('encryptionKey', hex(await generateKey()))
        }
        return await fromHex(localStorage.getItem('encryptionKey'))
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
            const pluginKey = await getKey()
            const storage = await chrome.storage.session.get()
            const tab = await getCurrentTab()
            checkedTab = { id: tab.id, url: tab.url }
            iframe.contentWindow.postMessage(
                {
                    pluginKey: hex(pluginKey),
                    encryptedPassword: storage.encryptedPassword,
                    // Send information about the current tab
                    currentUrl: tab.url,
                },
                lockyOrigin // target only the locky origin
            )
            return
        }

        // Decrypt using the shared key we have with Locky
        const key = await getKey()
        const pt = await decryptAES(new Uint8Array(ev.data), key)
        const event = JSON.parse(new TextDecoder().decode(pt))

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
