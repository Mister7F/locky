import scrypt from 'scrypt-async';

export async function getTotpCode(token) {
    const epoch = Math.floor(Date.now() / 1000 / 30);

    // Number to bytes array on 8 bytes
    const encodedTime = new Uint8Array(
        [0, 0, 0, 0, 0, 0, 0, 0].map(
            (_, i) => Math.floor(epoch / Math.pow(256, 7 - i)) % 256,
        ),
    );

    let hash;
    try {
        hash = await hmac(b32Decode(token), encodedTime);
    } catch {
        return null;
    }

    const offset = hash[hash.length - 1] % 16;

    const binary =
        ((hash[offset] & 0x7f) << 24) +
        (hash[offset + 1] << 16) +
        (hash[offset + 2] << 8) +
        hash[offset + 3];

    const totp = '' + (binary % 1000000);
    return totp.padStart(6, 0);
}

/**
 * Sign the given message with the given key using HMAC
 *
 * @param {Uint8Array} Key to use to sign the message
 * @param {Uint8Array} The message to authenticate
 * @param {string} The algorithm to use ('SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512')
 */
export async function hmac(key, data, hash = 'SHA-1') {
    const hmac = await window.crypto.subtle.importKey(
        'raw',
        key,
        {
            name: 'HMAC',
            hash: { name: hash },
        },
        false,
        ['sign'],
    );

    const signature = await window.crypto.subtle.sign('HMAC', hmac, data);
    return new Uint8Array(signature);
}

export function b32Decode(s) {
    s = s.toUpperCase();
    const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    let number = BigInt(0);
    for (let l of s) {
        const value = alpha.indexOf(l);
        if (value < 0) {
            continue;
        }
        number *= BigInt(Math.pow(2, 5));
        number += BigInt(value);
    }

    // Each character encode 5 bits
    const bitLength = s.length * 5;
    // Remove trailing bits
    number >>= BigInt(bitLength % 8);

    const bytesArray = [];
    while (number) {
        bytesArray.splice(0, 0, number % BigInt(256));
        number /= BigInt(256);
    }

    return new Uint8Array(bytesArray.map((i) => parseInt(i)));
}

/**
 * Concatenate the given list of bytes array
 *
 * @param {Uint8Array[]} List of bytes array to concatenate
 * @return {Uint8Array} A single bytes array containing all other
 */
export function concatenate(...arrays) {
    const size = arrays.reduce((a, b) => a + b.byteLength, 0);
    const result = new Uint8Array(size);

    let offset = 0;
    for (let arr of arrays) {
        result.set(arr, offset);
        offset += arr.byteLength;
    }

    return result;
}

export function passwordStrength(password) {
    if (!password || !password.length) {
        return;
    }

    let charsetSize = 0;
    if (password.match(/[a-z]/)) {
        charsetSize++;
    }
    if (password.match(/[A-Z]/)) {
        charsetSize++;
    }
    if (password.match(/[0-9]/)) {
        charsetSize++;
    }
    if (password.match(/[^a-zA-Z0-9]/)) {
        charsetSize += 2;
    }
    // Password with all character types, with length >= 10 has maximum strength
    const computedStrength = parseInt(password.length * charsetSize * 2);
    return Math.min(computedStrength, 100);
}

/**
 * Encrypt the given plaintext with the password
 *
 * 1. Use Scrypt to derive the password into an encryption key
 * 2. Encrypt using xChaCha20
 * 3. Encrypt the result with AES-256 (PKCS7 padding)
 */
export async function encrypt(plaintext, password) {
    const [key, salt] = await derivePassword(password);

    const keyChaCha = key.slice(0, 32);
    const keyAes = key.slice(32, 64);

    password = null;

    const ciphertext = await encryptXChaCha20Poly1305(plaintext, keyChaCha);

    const ciphertext2 = await encryptAES(ciphertext, keyAes);

    return concatenate(salt, ciphertext2);
}

/**
 * Decrypt the given plaintext with the password
 *
 * 1. Use Scrypt to derive the password into an encryption key
 * 2. Decrypt the result with AES-256 (PKCS7 padding)
 * 3. Decrypt using xChaCha20
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {string} The password to used (bill be derived)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decrypt(ciphertext, password) {
    const salt = ciphertext.slice(0, 16);
    const encrypted = ciphertext.slice(16);

    const [key, _] = await derivePassword(password, salt);

    const keyChaCha = key.slice(0, 32);
    const keyAes = key.slice(32, 64);

    const encrypted2 = await decryptAES(encrypted, keyAes);

    return await decryptXChaCha20Poly1305(encrypted2, keyChaCha);
}

/**
 * Encrypt the given plaintext with the given key using AES-256
 *
 * @param {Uint8Array} The plaintext to encrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The encrypted message or null if something bad happened
 */
export async function encryptAES(plaintext, key) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    const cryptoKey = await rawKeyToCryptoKey(key);

    let t = performance.now();

    try {
        const ciphertext = await window.crypto.subtle.encrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            plaintext,
        );

        console.debug('AES encryption took', performance.now() - t, 'ms');

        return concatenate(iv, new Uint8Array(ciphertext));
    } catch {}

    return null;
}

/**
 * Decrypt the given ciphertext with the given key using AES-256
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decryptAES(ciphertext, key) {
    if (!ciphertext || ciphertext.length < 32) {
        // 16 for the IV and 16 for at least 1 AES block
        return null;
    }

    const cryptoKey = await rawKeyToCryptoKey(key);

    const iv = ciphertext.slice(0, 16);
    const encrypted = ciphertext.slice(16);

    let t = performance.now();

    try {
        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-CBC', iv },
            cryptoKey,
            encrypted,
        );

        console.debug('AES decryption took', performance.now() - t, 'ms');

        return new Uint8Array(decrypted);
    } catch {}

    return null;
}

/**
 * Encrypt the given plaintext with the given key using xChaCha20
 *
 * @param {Uint8Array} The plaintext to encrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The encrypted message or null if something bad happened
 */
export async function encryptXChaCha20Poly1305(plaintext, key) {
    // xChaCha20: nonce need 24 bytes
    const nonce = sodium.randombytes_buf(24);

    let t = performance.now();

    try {
        const encrypted = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
            plaintext,
            null,
            null,
            nonce,
            key,
        );

        console.debug('xChacha encryption took', performance.now() - t, 'ms');

        return concatenate(nonce, encrypted);
    } catch {}

    return null;
}

/**
 * Decrypt the given ciphertext with the given key using xChaCha20
 *
 * @param {Uint8Array} The ciphertext to decrypt
 * @param {Uint8Array} The key to use (32 bytes)
 * @return {Uint8Array} The decrypted message or null if something bad happened
 */
export async function decryptXChaCha20Poly1305(ciphertext, key) {
    if (!ciphertext || ciphertext.length < 40) {
        return null;
    }

    const nonce = ciphertext.slice(0, 24);
    const encrypted = ciphertext.slice(24);

    try {
        let t = performance.now();

        const plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            null,
            encrypted,
            null,
            nonce,
            key,
        );

        console.debug('xChacha decryption took', performance.now() - t, 'ms');

        return plaintext;
    } catch {}

    return null;
}

/**
 * Derive the password using Scrypt
 *
 * @param {String} Password to derive
 * @param {Uint8Array} Salt to use for the derivation, will be generated if null
 * @return {[Uint8Array, Uint8Array]} The derived key and the salt used
 */
async function derivePassword(password, salt = null) {
    if (!salt) {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
    } else if (salt.length !== 16) {
        console.error('Salt length must be 16');
    }

    let t = performance.now();

    const options = {
        dkLen: 64,
        N: 32768,
        r: 15,
        p: 1,
        encoding: 'binary',
        interruptStep: 5000,
    };

    return new Promise((resolve) => {
        scrypt(password, salt, options, (hash) => {
            console.debug('Password derivation took', performance.now() - t, 'ms');
            resolve([hash, salt]);
        });
    });
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
        ['decrypt', 'encrypt'],
    );
}
