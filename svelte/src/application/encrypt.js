import { compressSync, decompressSync, strToU8, strFromU8 } from 'fflate';
import { encrypt, decrypt } from '../helpers/crypto.js';

export async function encryptDatabase(database, password) {
    const strDatabase = JSON.stringify(database);
    const compressed = compressSync(strToU8(strDatabase));
    console.log('Compress wallet from', strDatabase.length, 'to', compressed.byteLength);
    const encrypted = await encrypt(compressed, password);
    return encrypted;
}

// data: ArrayBuffer
export async function decryptDatabase(data, password) {
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data);
    }

    if (!data || !data.byteLength) {
        console.error('Empty file');
        return null;
    }

    let decrypted = null;
    try {
        decrypted = await decrypt(data, password);
    } catch {
        console.error('Decryption failed');
        return null;
    }

    if (!decrypted) {
        console.error('Decryption failed');
        return null;
    }

    let decompressed = null;
    try {
        decompressed = decompressSync(decrypted);
    } catch (error) {
        console.error('Decompression failed');
        return null;
    }

    if (!decompressed || !decompressed.length) {
        console.error('Decompression failed');
        return null;
    }

    try {
        const database = JSON.parse(strFromU8(decompressed));
        if (!database.accounts || !database.folders) {
            return null;
        }
        return database;
    } catch {
        console.error('Not a JSON file');
        return;
    }
}
