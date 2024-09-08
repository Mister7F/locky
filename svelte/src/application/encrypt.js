import { compressSync, decompressSync, strFromU8, strToU8 } from 'fflate'
import { decrypt, encrypt } from '../helpers/crypto.js'
import { savePassword } from '../helpers/web_extension.js'

export async function encryptDatabase(database, password) {
    const strDatabase = JSON.stringify(database)

    const compressed = compressSync(strToU8(strDatabase))

    console.debug(
        'Compress from',
        strDatabase.length,
        'to',
        compressed.byteLength
    )

    const [key, wallet] = await encrypt(compressed, password)
    savePassword(password, key)
    return [key, wallet]
}

// data: ArrayBuffer
export async function decryptDatabase(data, password, _key) {
    if (data instanceof ArrayBuffer) {
        data = new Uint8Array(data)
    }

    if (!data || !data.length) {
        console.error('Empty file')
        return null
    }

    const [key, decrypted] = await decrypt(data, password, _key)
    if (!decrypted) {
        console.error('Decryption failed')
        return null
    }

    let decompressed = null
    try {
        decompressed = decompressSync(decrypted)
    } catch (error) {
        console.error('Decompression failed')
        return null
    }

    if (!decompressed || !decompressed.length) {
        console.error('Decompression failed')
        return null
    }

    try {
        const database = JSON.parse(strFromU8(decompressed))
        if (!database.accounts || !database.folders) {
            return null
        }
        savePassword(password, key)
        return database
    } catch {
        console.error('Not a JSON file')
        return
    }
}
