import { encryptDatabase, decryptDatabase } from './encrypt.js';
import * as indexdb from './indexdb.js';

let wallet = null;
let masterPassword = null;

export async function newWallet(password) {
    wallet = {
        accounts: [],
        folders: [{ id: 0, name: 'All', icon: 'home' }],
    };
    masterPassword = password;
    return await saveWallet();
}

export async function getEncryptedWallet() {
    const encryptedWallet = await indexdb.get('wallet');
    return encryptedWallet;
}

export async function unlock(password) {
    const encryptedWallet = await indexdb.get('wallet');
    if (!encryptedWallet) {
        return;
    }

    const newWallet = await decryptDatabase(encryptedWallet, password);
    if (!newWallet) {
        return;
    }

    wallet = newWallet;
    masterPassword = password;
    return wallet;
}

export async function login(filedata, password) {
    const database = await decryptDatabase(filedata, password);
    if (!database) {
        return;
    }
    // return null;

    masterPassword = password;
    wallet = database;
    masterPassword = password;
    return await saveWallet();
}

export async function logout(keepIndexDb) {
    wallet = null;
    masterPassword = null;
    if (!keepIndexDb) {
        await indexdb.set('wallet', 0);
    }
}

export async function walletInMemory() {
    const encryptedWallet = await indexdb.get('wallet');
    return encryptedWallet && encryptedWallet.byteLength;
}

async function saveWallet() {
    const encryptedWallet = await encryptDatabase(wallet, masterPassword);
    await indexdb.set('wallet', encryptedWallet);
    return wallet;
}

export async function downloadWallet() {
    let encrypted = await getEncryptedWallet();
    if (!encrypted) {
        encrypted = await encryptDatabase(wallet, masterPassword);
    }

    const filename = 'wallet.lck';
    const blob = new Blob([encrypted]);
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
}

export async function moveAccount(fromAccount, toAccount) {
    const insertIndex = wallet['accounts'].findIndex((account) => account === toAccount);
    const movedAccount = wallet['accounts'].find((account) => account === fromAccount);
    const newAccounts = wallet['accounts'].filter((account) => account !== fromAccount);
    newAccounts.splice(insertIndex, 0, movedAccount);
    wallet['accounts'] = newAccounts;
    return await saveWallet();
}

export async function newAccount(account) {
    wallet['accounts'].push(account);
    return await saveWallet();
}

export async function updateAccount(accountIndex, account) {
    wallet['accounts'][accountIndex] = account;
    return await saveWallet();
}

export async function removeAccount(accountIndex) {
    wallet['accounts'].splice(accountIndex, 1);
    return await saveWallet();
}

export async function changeFolder(account, newFolderId) {
    if (wallet['folders'].find((folder) => folder.id === newFolderId) < 0) {
        console.error("The folder doesn't exist");
        return;
    }
    account['folder_id'] = newFolderId;
    return await saveWallet();
}

export async function moveFolder(folder, newIndex) {
    if (!folder.id || newIndex < 0) {
        // Can not move the "All" directory
        return;
    }
    newIndex += 1; // Index 0 is the "All" directory
    const newFolders = wallet['folders'].filter((f) => f !== folder);
    newFolders.splice(newIndex, 0, folder);
    wallet['folders'] = newFolders;
    return await saveWallet();
}

export async function updateFolder(folder) {
    if (!folder.id) {
        let folderId = 0;
        do {
            // Todo: better ID generation
            folderId = Math.floor(Math.random() * 10000000000000);
        } while (wallet['folders'].findIndex((f) => f.id === folderId) >= 0);

        // New folder
        folder.id = folderId;
        wallet['folders'].push(folder);
        return await saveWallet();
    }

    const index = wallet['folders'].findIndex((f) => f.id === folder.id);
    if (index < 0) {
        console.error("The folder doesn't exist");
        return;
    }
    wallet['folders'][index] = folder;
    return await saveWallet();
}

export async function deleteFolder(folder) {
    if (!folder.id) {
        console.error('Can not remove "All" folder');
        return;
    }
    wallet['folders'] = wallet['folders'].filter((f) => f.id !== folder.id);
    return await saveWallet();
}

export async function updatePassword(oldPassword, newPassword) {
    if (oldPassword !== masterPassword) {
        return false;
    }
    masterPassword = newPassword;
    const encryptedWallet = await saveWallet();
    return !!encryptedWallet;
}
