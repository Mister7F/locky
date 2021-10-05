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
        hash = await hmac(token, encodedTime);
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

export async function hmac(key, data) {
    const encoder = new TextEncoder('utf-8');
    const bKey = b32Decode(key);

    const hmac = await window.crypto.subtle.importKey(
        'raw',
        bKey,
        {
            name: 'HMAC',
            hash: { name: 'SHA-1' },
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

export async function encrypt(plaintext, password) {
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const salt = window.crypto.getRandomValues(new Uint8Array(16));

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey'],
    );

    const key = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        {
            name: 'AES-CBC',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt'],
    );

    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        key,
        plaintext,
    );

    const fullCiphertext = concatenate(salt, iv, new Uint8Array(ciphertext));

    return fullCiphertext;
}

export async function decrypt(ciphertext, password) {
    if (!password || !password.length) {
        return null;
    }

    if (!ciphertext || ciphertext.length < 48) {
        // 16 bytes for the salt, 16 for the IV and 16 for at least 1 AES block
        return null;
    }

    const salt = ciphertext.slice(0, 16);
    const iv = ciphertext.slice(16, 32);
    const encrypted = ciphertext.slice(32);

    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey'],
    );

    const key = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        {
            name: 'AES-CBC',
            length: 256,
        },
        true,
        ['encrypt', 'decrypt'],
    );

    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        key,
        encrypted,
    );

    return new Uint8Array(decrypted);
}

// Uint8Array[]
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
