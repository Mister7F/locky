async function generateKey() {
    const key = new Uint8Array(32)
    window.crypto.getRandomValues(key)
    return key
}

// Code from Locky
function hex(byteArray) {
    if (!byteArray) {
        return ''
    }
    return Array.from(new Uint8Array(byteArray), function (byte) {
        return ('0' + (byte & 0xff).toString(16)).slice(-2)
    }).join('')
}

function fromHex(hex) {
    const len = hex.length / 2
    const buffer = new ArrayBuffer(len)
    const view = new Uint8Array(buffer)
    for (let i = 0; i < len; i++) {
        view[i] = parseInt(hex.substr(i * 2, 2), 16)
    }
    return buffer
}
