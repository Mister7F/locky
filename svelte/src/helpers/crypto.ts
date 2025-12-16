import scrypt from 'scrypt-async'
import _sodium from 'libsodium-wrappers'
import zxcvbn from 'zxcvbn'

export async function getTotpCode(token: string): Promise<string | undefined> {
    const epoch = Math.floor(Date.now() / 1000 / 30)

    // Number to bytes array on 8 bytes
    const encodedTime = new Uint8Array(
        [0, 0, 0, 0, 0, 0, 0, 0].map(
            (_, i) => Math.floor(epoch / Math.pow(256, 7 - i)) % 256
        )
    )

    let hash
    try {
        hash = await hmac(b32Decode(token), encodedTime)
    } catch {
        return
    }

    const offset = hash[hash.length - 1] % 16

    const binary =
        ((hash[offset] & 0x7f) << 24) +
        (hash[offset + 1] << 16) +
        (hash[offset + 2] << 8) +
        hash[offset + 3]

    const totp = '' + (binary % 1000000)
    return totp.padStart(6, '0')
}

/**
 * Sign the given message with the given key using HMAC
 *
 * @param {string} The message to hash
 * @param {string} The algorithm to use ('SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512')
 */
export async function digest(
    message: string,
    algorithm: string = 'SHA-1'
): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hash = await crypto.subtle.digest(algorithm, data)
    const hashArray = Array.from(new Uint8Array(hash))
    const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    return hashHex.toUpperCase()
}

/**
 * Sign the given message with the given key using HMAC
 *
 * @param {Uint8Array} Key to use to sign the message
 * @param {Uint8Array} The message to authenticate
 * @param {string} The algorithm to use ('SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512')
 */
export async function hmac(
    key: Uint8Array,
    data: Uint8Array,
    hash: string = 'SHA-1'
): Promise<Uint8Array> {
    const hmac = await window.crypto.subtle.importKey(
        'raw',
        key as BufferSource,
        {
            name: 'HMAC',
            hash: { name: hash },
        },
        false,
        ['sign']
    )

    const signature = await window.crypto.subtle.sign(
        'HMAC',
        hmac,
        data as BufferSource
    )
    return new Uint8Array(signature)
}

export function b32Decode(s: string): Uint8Array {
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    s = s.toUpperCase().replace(/[^A-Z2-7]/, '')

    let number = BigInt(0)
    let bitLength = 0
    for (let l of s) {
        const value = alpha.indexOf(l)
        if (value < 0) {
            continue
        }
        number *= BigInt(Math.pow(2, 5))
        number += BigInt(value)
        // Each character encode 5 bits
        bitLength += 5
    }

    // Remove trailing bits
    number >>= BigInt(bitLength % 8)

    const bytesArray = []
    while (number) {
        bytesArray.splice(0, 0, number % BigInt(256))
        number /= BigInt(256)
    }

    return new Uint8Array(bytesArray.map((i) => parseInt(i)))
}

/**
 * Concatenate the given list of bytes array
 *
 * @param {Uint8Array[]} List of bytes array to concatenate
 * @return {Uint8Array} A single bytes array containing all other
 */
export function concatenate(...arrays: Uint8Array[]): Uint8Array {
    const size = arrays.reduce((a, b) => a + b.byteLength, 0)
    const result = new Uint8Array(size)

    let offset = 0
    for (let arr of arrays) {
        result.set(arr, offset)
        offset += arr.byteLength
    }

    return result
}

// 32 bits representation of the given string
function passwordKey(s: string): number {
    let h = 0,
        l = s.length,
        i = 0
    if (l > 0) while (i < l) h = ((h << 5) - h + s.charCodeAt(i++)) | 0
    return h
}

// zxcvbn is relatively slow (3 ms / passwords)
// so we cache the result
const strength_cache: Record<
    number,
    { strength: number; detail: zxcvbn.ZXCVBNResult }
> = {}
let total_time = 0
export function passwordStrength(
    password: string,
    detail?: boolean
): { strength: number; detail: zxcvbn.ZXCVBNResult } {
    password = password || ''
    const key = passwordKey(password)
    let result = strength_cache[key]

    if (result === undefined) {
        const detail = zxcvbn(password)
        delete (detail as { password?: unknown }).password

        const guesses = detail.guesses_log10 || 0
        const strength = Math.min(Math.floor(guesses * 5), 100)
        if (strength >= 80) {
            strength_cache[key] = { strength, detail: null }
        } else {
            strength_cache[key] = { strength, detail }
        }
    }
    return strength_cache[key]
}

/**
 * Encrypt the given plaintext with the password
 *
 * 1. Use Scrypt to derive the password into an encryption key
 * 2. Encrypt using xChaCha20
 * 3. Encrypt the result with AES-256 (PKCS7 padding)
 */
export async function encrypt(
    plaintext: Uint8Array,
    password: string
): Promise<[Uint8Array, Uint8Array]> {
    const [key, salt] = await derivePassword(password)

    const keyChaCha = key.slice(0, 32)
    const keyAes = key.slice(32, 64)

    password = null

    const ciphertext = await encryptXChaCha20Poly1305(plaintext, keyChaCha)

    const ciphertext2 = await encryptAES(ciphertext, keyAes)

    return [key, concatenate(salt, ciphertext2)]
}

/**
 * Decrypt the given plaintext with the password
 *
 * We can directly give the derived key if it has been saved to speed up.
 *
 * 1. Use Scrypt to derive the password into an encryption key
 * 2. Decrypt the result with AES-256 (PKCS7 padding)
 * 3. Decrypt using xChaCha20
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {string} The password to used (bill be derived)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decrypt(
    ciphertext: Uint8Array,
    password: string,
    _key?: Uint8Array
): Promise<[Uint8Array, Uint8Array | null]> {
    const salt = ciphertext.slice(0, 16)
    const encrypted = ciphertext.slice(16)

    const key = _key || (await derivePassword(password, salt))[0]

    const keyChaCha = key.slice(0, 32)
    const keyAes = key.slice(32, 64)

    const encrypted2 = await decryptAES(encrypted, keyAes)

    return [key, await decryptXChaCha20Poly1305(encrypted2, keyChaCha)]
}

/**
 * Encrypt the given plaintext with the given key using AES-256
 *
 * @param {Uint8Array} The plaintext to encrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The encrypted message or null if something bad happened
 */
export async function encryptAES(
    plaintext: Uint8Array | ArrayBuffer,
    key: Uint8Array
): Promise<Uint8Array | undefined> {
    const plainBytes =
        plaintext instanceof Uint8Array ? plaintext : new Uint8Array(plaintext)
    const iv = window.crypto.getRandomValues(new Uint8Array(16))

    const cryptoKey = await rawKeyToCryptoKey(key)

    let t = performance.now()

    try {
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            plainBytes as BufferSource
        )

        console.debug('AES encryption took', performance.now() - t, 'ms')

        return concatenate(iv, new Uint8Array(ciphertext))
    } catch {}

    return
}

/**
 * Decrypt the given ciphertext with the given key using AES-256
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decryptAES(
    ciphertext: Uint8Array | ArrayBuffer | null,
    key: Uint8Array
): Promise<Uint8Array | undefined> {
    if (!ciphertext) {
        console.error('Empty ciphertext')
        return
    }

    const cipherBytes =
        ciphertext instanceof Uint8Array
            ? ciphertext
            : new Uint8Array(ciphertext)
    if (cipherBytes.length < 32) {
        // 16 for the IV and 16 for at least 1 AES block
        console.error('Empty ciphertext')
        return
    }

    const cryptoKey = await rawKeyToCryptoKey(key)

    const iv = cipherBytes.slice(0, 16)
    const encrypted = cipherBytes.slice(16)

    let t = performance.now()

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            encrypted
        )

        console.debug('AES decryption took', performance.now() - t, 'ms')

        return new Uint8Array(decrypted)
    } catch {}

    return
}

/**
 * Encrypt the given plaintext with the given key using xChaCha20
 *
 * @param {Uint8Array} The plaintext to encrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The encrypted message or null if something bad happened
 */
export async function encryptXChaCha20Poly1305(
    plaintext: Uint8Array,
    key: Uint8Array
): Promise<Uint8Array | undefined> {
    // xChaCha20: nonce need 24 bytes
    await _sodium.ready
    const sodium = _sodium

    const nonce = sodium.randombytes_buf(24)

    let t = performance.now()

    try {
        const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
            plaintext,
            null,
            null,
            nonce,
            key
        )

        console.debug('xChacha encryption took', performance.now() - t, 'ms')

        return concatenate(nonce, encrypted)
    } catch {}

    return
}

/**
 * Decrypt the given ciphertext with the given key using xChaCha20
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decryptXChaCha20Poly1305(
    ciphertext: Uint8Array | null,
    key: Uint8Array
): Promise<Uint8Array | undefined> {
    await _sodium.ready
    const sodium = _sodium
    if (!ciphertext || ciphertext.length < 40) {
        return
    }

    const nonce = ciphertext.slice(0, 24)
    const encrypted = ciphertext.slice(24)

    try {
        let t = performance.now()

        const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            encrypted,
            null,
            nonce,
            key
        )

        console.debug('xChacha decryption took', performance.now() - t, 'ms')

        return plaintext
    } catch {}

    return
}

/**
 * Derive the password using Scrypt
 *
 * @param {String} Password to derive
 * @param {Uint8Array} Salt to use for the derivation, will be generated if null
 * @return {[Uint8Array, Uint8Array]} The derived key and the salt used
 */
async function derivePassword(
    password: string,
    salt: Uint8Array | null = null
): Promise<[Uint8Array, Uint8Array]> {
    if (!salt) {
        salt = window.crypto.getRandomValues(new Uint8Array(16))
    } else if (salt.length !== 16) {
        console.error('Salt length must be 16')
    }

    let t = performance.now()

    const options = {
        dkLen: 64,
        N: 32768,
        r: 15,
        p: 1,
        encoding: 'binary',
        interruptStep: 5000,
    }

    return new Promise((resolve) => {
        scrypt(password, salt, options, (hash: Uint8Array) => {
            console.debug(
                'Password derivation took',
                performance.now() - t,
                'ms'
            )
            resolve([hash, salt])
        })
    })
}

/**
 * Transform a Uint8Array key into a CryptoKey compatible with `crypto.subtle.encrypt`
 *
 * @param rawKey {Uint8Array} Key to transform
 * @return CryptoKey
 */
async function rawKeyToCryptoKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
        'raw',
        rawKey as BufferSource,
        { name: 'AES-CBC' },
        true,
        ['decrypt', 'encrypt']
    )
}
