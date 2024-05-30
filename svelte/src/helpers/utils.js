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
