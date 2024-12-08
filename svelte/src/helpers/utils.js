import WebExtension from './web_extension.svelte.js'

/**
 * Return true if the URL is valid.
 * Avoid XSS based on `javascript:alert(1)`.
 */
export function isUrlValid(url) {
    if (!url) {
        return false
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return true
    }
    return false
}

export function getCookie(name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
}

/**
 * Copy the given value in the clipboard.
 *
 * @param {string | Promise} text: the text to copy, or a Promise that return the text to copy
 */
export function copyValue(text) {
    if (text.constructor.name === 'Promise') {
        copyValueAsync(text)
        return
    }

    if (!navigator.clipboard) {
        copyValueFallback(text)
        return
    }
    navigator.clipboard.writeText(text).catch((err) => copyValueFallback(text))
}

function copyValueFallback(text) {
    const textArea = document.createElement('textarea')
    textArea.value = text

    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
        const successful = document.execCommand('copy')
        const msg = successful ? 'successful' : 'unsuccessful'
        console.error('Copy Fallback failed')
    } catch (err) {
        console.error('Copy Fallback failed', err)
    }

    document.body.removeChild(textArea)
}

/**
 * On Safari, we can not copy text in an async event handler.
 *
 * See https://developer.apple.com/forums/thread/691873
 */
function copyValueAsync(asyncGetText) {
    if (!typeof ClipboardItem || !navigator.clipboard.write) {
        asyncGetText.then((text) => copyValue(text))
        return
    }

    const text = new ClipboardItem({
        'text/plain': asyncGetText.then(
            (text) => new Blob([text], { type: 'text/plain' })
        ),
    })
    navigator.clipboard.write([text])
}

export function hex(byteArray) {
    if (!byteArray) {
        return ''
    }
    return Array.from(new Uint8Array(byteArray), function (byte) {
        return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')
}

export function fromHex(hex) {
    const len = hex.length / 2
    const buffer = new ArrayBuffer(len)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < len; i++) {
        view[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return buffer
}

export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function toBytes(str) {
    return new TextEncoder().encode(str)
}

export function fromBytes(bytes) {
    return new TextDecoder().decode(bytes)
}

export function openUrl(url) {
    if (WebExtension.inWebExtension) {
        window.open(url)
    } else {
        window.location = url
    }
}

export function normalizeHost(url) {
    if (!url) {
        return
    }
    let origin
    try {
        origin = new URL(url).host
    } catch {
        return
    }
    if (origin.startsWith('www.')) {
        origin = origin.slice(4)
    }
    if (origin.startsWith('login.')) {
        origin = origin.slice(6)
    }
    return origin
}
