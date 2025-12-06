import { compressSync, decompressSync, strFromU8, strToU8 } from 'fflate'
import { decrypt, encrypt } from '../helpers/crypto.js'
import WebExtension from '../helpers/web_extension.svelte.js'
import { savePassword } from '../helpers/web_extension.svelte.js'

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
        return [null, null]
    }

    const [key, decrypted] = await decrypt(data, password, _key)
    if (!decrypted) {
        console.error('Decryption failed')
        return [null, null]
    }

    let decompressed = null
    try {
        decompressed = decompressSync(decrypted)
    } catch (error) {
        console.error('Decompression failed')
        return [null, null]
    }

    if (!decompressed || !decompressed.length) {
        console.error('Decompression failed')
        return [null, null]
    }

    let database
    try {
        database = JSON.parse(strFromU8(decompressed))
        if (!database.accounts || !database.folders) {
            return [null, null]
        }
    } catch {
        console.error('Not a JSON file')
        return [null, null]
    }
    fixMissingIds(database)
    return [database, key]
}

/**
 * Fix in place the missing ids of the accounts / folders.
 */
function fixMissingIds(wallet) {
    for (let account of wallet.accounts) {
        if (!account.id) {
            account.id = crypto.randomUUID()
        }
        if (account.folder_id) {
            account.folder_id = account.folder_id.toString()
        }
    }
    for (let folder of wallet.folders) {
        if (!folder.id) {
            folder.id = crypto.randomUUID()
        } else {
            // For old wallet where the identifier were numbers
            folder.id = folder.id.toString()
        }
    }
}
