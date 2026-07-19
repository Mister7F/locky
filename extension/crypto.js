// Code from Locky

/**
 * Encrypt the given plaintext with AES-256-GCM.
 *
 * The returned value is `nonce || ciphertext || authentication tag`. WebCrypto
 * appends the authentication tag to the ciphertext automatically.
 *
 * @param {Uint8Array} plaintext The plaintext to encrypt
 * @param {Uint8Array} key The key to use (32 bytes)
 * @return {Uint8Array} The authenticated ciphertext
 */
async function encryptAESGCM(plaintext, key) {
    const nonce = window.crypto.getRandomValues(new Uint8Array(12))
    const cryptoKey = await rawKeyToCryptoKeyGCM(key)
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce, tagLength: 128 },
        cryptoKey,
        plaintext
    )
    return concatenate(nonce, new Uint8Array(ciphertext))
}

/**
 * Decrypt and authenticate a value produced by `encryptAESGCM`.
 *
 * @param {Uint8Array} ciphertext The nonce-prefixed ciphertext
 * @param {Uint8Array} key The key to use (32 bytes)
 * @return {Uint8Array|null} The plaintext, or null if authentication fails
 */
async function decryptAESGCM(ciphertext, key) {
    // 12-byte nonce, 16-byte authentication tag, and at least one data byte.
    if (!ciphertext || ciphertext.length < 29) {
        return null
    }

    const nonce = ciphertext.slice(0, 12)
    const encrypted = ciphertext.slice(12)
    const cryptoKey = await rawKeyToCryptoKeyGCM(key)

    try {
        const plaintext = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce, tagLength: 128 },
            cryptoKey,
            encrypted
        )
        return new Uint8Array(plaintext)
    } catch {
        return null
    }
}

async function rawKeyToCryptoKeyGCM(rawKey) {
    return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt', 'encrypt']
    )
}

/**
 * Derive a 256-bit subkey from key material and an specific context.
 *
 * @param {Uint8Array} keyMaterial Random master key
 * @param {string} context Domain-separation context
 * @return {Uint8Array} Derived 256-bit key
 */
async function deriveKeyHKDF(keyMaterial, context) {
    const encoder = new TextEncoder()
    const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        'HKDF',
        false,
        ['deriveBits']
    )
    const bits = await window.crypto.subtle.deriveBits(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: encoder.encode('locky-extension-hkdf-v1'),
            info: encoder.encode(context),
        },
        cryptoKey,
        256
    )
    return new Uint8Array(bits)
}

/**
 * Concatenate the given byte arrays.
 *
 * @param {...Uint8Array} arrays Byte arrays to concatenate
 * @return {Uint8Array} A single byte array
 */
function concatenate(...arrays) {
    const size = arrays.reduce((total, array) => total + array.byteLength, 0)
    const result = new Uint8Array(size)

    let offset = 0
    for (const array of arrays) {
        result.set(array, offset)
        offset += array.byteLength
    }

    return result
}
