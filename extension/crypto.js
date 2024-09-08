// Code from Locky

/**
 * Encrypt the given plaintext with the given key using AES-256
 *
 * @param {Uint8Array} The plaintext to encrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The encrypted message or null if something bad happened
 */
async function encryptAES(plaintext, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16))

    const cryptoKey = await rawKeyToCryptoKey(key)

    let t = performance.now()

    try {
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            plaintext
        )

        console.debug('AES encryption took', performance.now() - t, 'ms')

        return concatenate(iv, new Uint8Array(ciphertext))
    } catch {}

    return null
}

/**
 * Decrypt the given ciphertext with the given key using AES-256
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
async function decryptAES(ciphertext, key) {
    if (!ciphertext || ciphertext.length < 32) {
        // 16 for the IV and 16 for at least 1 AES block
        console.error('Empty ciphertext')
        return null
    }

    const cryptoKey = await rawKeyToCryptoKey(key)

    const iv = ciphertext.slice(0, 16)
    const encrypted = ciphertext.slice(16)

    let t = performance.now()

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            encrypted
        )
        return new Uint8Array(decrypted)
    } catch {}
    return null
}

/**
 * Transform a Uint8Array key into a CryptoKey compatible with `crypto.subtle.encrypt`
 *
 * @param rawKey {Uint8Array} Key to transform
 * @return CryptoKey
 */
async function rawKeyToCryptoKey(rawKey) {
    return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-CBC' },
        true,
        ['decrypt', 'encrypt']
    )
}

/**
 * Concatenate the given list of bytes array
 *
 * @param {Uint8Array[]} List of bytes array to concatenate
 * @return {Uint8Array} A single bytes array containing all other
 */
function concatenate(...arrays) {
    const size = arrays.reduce((a, b) => a + b.byteLength, 0)
    const result = new Uint8Array(size)

    let offset = 0
    for (let arr of arrays) {
        result.set(arr, offset)
        offset += arr.byteLength
    }

    return result
}
