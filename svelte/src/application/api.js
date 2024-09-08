import { decryptDatabase, encryptDatabase } from './encrypt.js'
import * as indexdb from './indexdb.js'

let wallet = null
let masterPassword = null

export async function newWallet(password) {
    wallet = {
        accounts: [],
        folders: [],
    }
    masterPassword = password
    return await saveWallet()
}

export async function getEncryptedWallet() {
    const encryptedWallet = await indexdb.get('wallet')
    return encryptedWallet
}

export async function unlock(password, key) {
    const encryptedWallet = await indexdb.get('wallet')
    if (!encryptedWallet) {
        return
    }

    const newWallet = await decryptDatabase(encryptedWallet, password, key)
    if (!newWallet) {
        return
    }

    wallet = newWallet
    masterPassword = password
    return wallet
}

export async function login(filedata, password) {
    const newWallet = await decryptDatabase(filedata, password)
    if (!newWallet) {
        return
    }

    masterPassword = password
    wallet = newWallet
    masterPassword = password
    return await saveWallet()
}

export async function logout(keepIndexDb) {
    wallet = null
    masterPassword = null
    if (!keepIndexDb) {
        await indexdb.set('wallet', 0)
    }
}

export async function walletInMemory() {
    const encryptedWallet = await indexdb.get('wallet')
    return encryptedWallet && encryptedWallet.byteLength
}

async function saveWallet() {
    setTimeout(async () => {
        // do not block the UI while encrypting the database
        const [key, encryptedWallet] = await encryptDatabase(
            wallet,
            masterPassword
        )
        await indexdb.set('wallet', encryptedWallet)
    })
    return { accounts: [...wallet.accounts], folders: [...wallet.folders] }
    // return JSON.parse(JSON.stringify(wallet))
}

export async function downloadWallet() {
    let encrypted = await getEncryptedWallet()
    if (!encrypted) {
        encrypted = (await encryptDatabase(wallet, masterPassword))[1]
    }

    const filename = 'wallet.lck'
    const blob = new Blob([encrypted])
    const elem = window.document.createElement('a')
    elem.href = window.URL.createObjectURL(blob)
    elem.download = filename
    document.body.appendChild(elem)
    elem.click()
    document.body.removeChild(elem)
}

export async function moveAccount(fromIndex, toIndex) {
    wallet.accounts = array_move(wallet.accounts, fromIndex, toIndex)
    return await saveWallet()
}

export async function newAccount(account) {
    wallet.accounts.push(account)
    return await saveWallet()
}

export async function updateAccount(accountIndex, account) {
    wallet.accounts[accountIndex] = account
    return await saveWallet()
}

export async function removeAccount(accountIndex) {
    wallet.accounts.splice(accountIndex, 1)
    return await saveWallet()
}

export async function changeFolder(account, newFolderId) {
    if (wallet.folders.find((folder) => folder.id === newFolderId) < 0) {
        console.error("The folder doesn't exist")
        return
    }
    account['folder_id'] = newFolderId
    return await saveWallet()
}

export async function moveFolder(folder, newIndex) {
    const newFolders = wallet.folders.filter((f) => f.id !== folder.id)
    newFolders.splice(newIndex, 0, folder)
    wallet.folders = newFolders
    return await saveWallet()
}

export async function updateFolder(folder) {
    if (!folder.id) {
        let folderId = 0
        do {
            // Todo: better ID generation
            folderId = Math.floor(Math.random() * 10000000000000)
        } while (wallet.folders.findIndex((f) => f.id === folderId) >= 0)

        // New folder
        folder.id = folderId
        wallet.folders.push(folder)
        return await saveWallet()
    }

    const index = wallet.folders.findIndex((f) => f.id === folder.id)
    if (index < 0) {
        console.error("The folder doesn't exist")
        return
    }
    wallet.folders[index] = folder
    return await saveWallet()
}

export async function deleteFolder(folder) {
    wallet.folders = wallet.folders.filter((f) => f.id !== folder.id)
    return await saveWallet()
}

export async function updatePassword(oldPassword, newPassword) {
    if (oldPassword !== masterPassword) {
        return false
    }
    masterPassword = newPassword
    const encryptedWallet = await saveWallet()
    return !!encryptedWallet
}

// HELPERS //
function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1
        while (k--) {
            arr.push(undefined)
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
    return arr
}
