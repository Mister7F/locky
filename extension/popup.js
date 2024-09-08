const iframe = document.querySelector('iframe')
const url = iframe.src

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
    if (ev.origin !== new URL(url).origin) {
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
        iframe.contentWindow.postMessage(
            {
                pluginKey: hex(pluginKey),
                encryptedPassword: storage.encryptedPassword,
                // Send information about the current tab
                currentUrl: tab.url,
            },
            '*'
        )
        return
    }

    // Decrypt using the shared key we have with Locky
    const key = await getKey()
    const pt = await decryptAES(new Uint8Array(ev.data), key)
    const event = JSON.parse(new TextDecoder().decode(pt))

    if (event.action === 'login') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'login',
                account: event.account,
            })
        })
    } else if (event.action === 'savePassword') {
        await chrome.storage.session.set({
            encryptedPassword: event.encryptedPassword,
        })
        console.debug('Password saved in the plugin session storage')
    } else {
        console.error('Web Extension: wrong action', event)
    }

    delete event
    delete pt
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
