import { savePassword } from '../helpers/web_extension.svelte.ts'
import Wallet from '../models/wallet.ts'
import Folder from '../models/folder.ts'
import Account from '../models/account.ts'
import { decryptDatabase, encryptDatabase } from './encrypt.ts'
import * as indexdb from './indexdb.ts'

let wallet: Wallet = null
let masterPassword: string = null

export async function newWallet(password: string): Promise<Wallet> {
    wallet = Wallet.fromJson({
        accounts: [],
        folders: [],
    })
    masterPassword = password
    return await saveWallet()
}

export async function getEncryptedWallet(): Promise<
    ArrayBuffer | Uint8Array | null
> {
    return (await indexdb.get('wallet')) as ArrayBuffer | Uint8Array | null
}

export async function unlock(
    password: string,
    key?: Uint8Array
): Promise<Wallet | undefined> {
    const encryptedWallet = (await indexdb.get('wallet')) as
        | ArrayBuffer
        | Uint8Array
        | null
    if (!encryptedWallet) {
        return
    }

    const [newWallet, next_key] = await decryptDatabase(
        encryptedWallet,
        password,
        key
    )
    if (!newWallet) {
        return
    }

    wallet = newWallet
    masterPassword = password
    if (!key) {
        savePassword(password, next_key)
    }

    return wallet
}

export async function login(
    filedata: ArrayBuffer | Uint8Array,
    password: string
): Promise<Wallet | undefined> {
    const [newWallet, key] = await decryptDatabase(filedata, password)
    if (!newWallet) {
        return
    }

    masterPassword = password
    wallet = newWallet
    savePassword(password, key)
    return await saveWallet()
}

export async function logout(keepIndexDb?: boolean): Promise<void> {
    wallet = null
    masterPassword = null
    if (!keepIndexDb) {
        await indexdb.set('wallet', 0)
    }
}

export async function walletInMemory(): Promise<boolean> {
    const encryptedWallet = (await indexdb.get('wallet')) as
        | ArrayBuffer
        | Uint8Array
        | null
    return !!(encryptedWallet && encryptedWallet.byteLength)
}

async function saveWallet(): Promise<Wallet> {
    setTimeout(async () => {
        // do not block the UI while encrypting the database
        const [key, encryptedWallet] = await encryptDatabase(
            wallet,
            masterPassword
        )
        await indexdb.set('wallet', encryptedWallet)
    })
    return Wallet.fromJson(JSON.parse(JSON.stringify(wallet)))
}

export async function downloadWallet(): Promise<void> {
    let encrypted = await getEncryptedWallet()
    if (!encrypted) {
        encrypted = (await encryptDatabase(wallet, masterPassword))[1]
    }

    const filename = 'wallet.lck'
    const blob = new Blob([encrypted as BlobPart])
    const elem = window.document.createElement('a')
    elem.href = window.URL.createObjectURL(blob)
    elem.download = filename
    document.body.appendChild(elem)
    elem.click()
    document.body.removeChild(elem)
}

export async function moveAccount(
    fromItem: Account,
    destItem: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (!fromItem.id || !destItem.id) {
        console.error('No ID for', fromItem, destItem)
        return
    }
    const fromIndex = wallet.accounts.findIndex((a) => a.id === fromItem.id)
    const toIndex = wallet.accounts.findIndex((a) => a.id === destItem.id)
    if (fromIndex < 0 || toIndex < 0) {
        console.error('Failed to move', fromItem, destItem)
        return
    }
    wallet.accounts = array_move(wallet.accounts, fromIndex, toIndex)
    return await saveWallet()
}

export async function newAccount(
    account: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (!account.id) {
        account.id = generateId()
    }
    wallet.accounts.push(account)
    return await saveWallet()
}

export async function updateAccount(
    account: Account
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const toUpdate = wallet.accounts.findIndex((a) => a.id === account.id)
    if (toUpdate < 0) {
        console.error('Account not found')
        return
    }
    wallet.accounts[toUpdate] = account
    return await saveWallet()
}

export async function removeAccount(
    accountIndex: number
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.accounts.splice(accountIndex, 1)
    return await saveWallet()
}

export async function changeFolder(
    account: Account,
    newFolderId: string
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    if (wallet.folders.findIndex((folder) => folder.id === newFolderId) < 0) {
        console.error("The folder doesn't exist")
        return
    }
    const toUpdate = wallet.accounts.find((a) => a.id === account.id)
    if (!toUpdate) {
        console.error('Account not found')
        return
    }
    toUpdate.folder_id = newFolderId
    return await saveWallet()
}

export async function moveFolder(
    folder: Folder,
    newIndex: number
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    const newFolders = wallet.folders.filter((f) => f.id !== folder.id)
    newFolders.splice(newIndex, 0, folder)
    wallet.folders = newFolders
    return await saveWallet()
}

export async function updateFolder(
    folder: Folder
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }

    const index = wallet.folders.findIndex((f) => f.id === folder.id)
    if (index < 0) {
        // New folder
        folder.id = generateId()
        wallet.folders.push(folder)
        return await saveWallet()
    }
    wallet.folders[index] = folder
    return await saveWallet()
}

export async function deleteFolder(
    folder: Folder
): Promise<Wallet | undefined> {
    if (!wallet) {
        return
    }
    wallet.folders = wallet.folders.filter((f) => f.id !== folder.id)
    return await saveWallet()
}

export async function updatePassword(
    oldPassword: string,
    newPassword: string
): Promise<boolean> {
    if (oldPassword !== masterPassword) {
        return false
    }
    masterPassword = newPassword
    const encryptedWallet = await saveWallet()
    return !!encryptedWallet
}

// HELPERS //
function array_move<T>(
    arr: Array<T | undefined>,
    old_index: number,
    new_index: number
): Array<T | undefined> {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
    return arr
}

/**
 * Generate a random identifier for an account / folder.
 */
function generateId(): string {
    return crypto.randomUUID()
}
