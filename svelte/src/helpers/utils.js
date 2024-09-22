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

export function copyValue(str) {
    navigator.clipboard.writeText(str)
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
