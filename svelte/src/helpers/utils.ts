import WebExtension from './web_extension.svelte.ts'

/**
 * Return true if the URL is valid.
 * Avoid XSS based on `javascript:alert(1)`.
 */
export function isUrlValid(url: string): boolean {
    if (!url?.length) {
        return false
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return true
    }
    return false
}

export function getCookie(name: string): string | undefined {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
}

/**
 * Copy the given value in the clipboard.
 *
 * @param {string | Promise} text: the text to copy, or a Promise that return the text to copy
 */
export function copyValue(text: string | Promise<string>) {
    if (text instanceof Promise) {
        copyValueAsync(text)
        return
    }

    if (!navigator.clipboard) {
        copyValueFallback(text)
        return
    }
    navigator.clipboard.writeText(text).catch(() => copyValueFallback(text))
}

function copyValueFallback(text: string) {
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
function copyValueAsync(asyncGetText: Promise<string>) {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard.write) {
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

export function hex(byteArray: ArrayBuffer | Uint8Array | null): string {
    if (!byteArray) {
        return ''
    }
    return Array.from(new Uint8Array(byteArray), function (byte) {
        return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')
}

export function fromHex(hex: string): Uint8Array {
    const len = hex.length / 2
    const view = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
        view[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return view
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export function toBytes(str: string): Uint8Array {
    return new TextEncoder().encode(str)
}

export function fromBytes(bytes: ArrayBuffer | Uint8Array): string {
    return new TextDecoder().decode(bytes)
}

export function openUrl(url: string) {
    if (WebExtension.inWebExtension) {
        window.open(url)
    } else {
        window.location.href = url
    }
}

export function normalizeHost(url?: string): string | undefined {
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

export function cleanSearchValue(txt: string | null | undefined): string {
    return (txt || '').replace(' ', '').toLowerCase()
}
