import Account from './account'
import Folder from './folder'

export type WalletSettings = {
    simpleLoginApiKey: string
}

export default class Wallet {
    // Don't allow object to be considered as wallet
    // EG: const w: Wallet = {accounts: []}
    private __brand!: 'Wallet'
    accounts: Account[]
    folders: Folder[]
    settings: WalletSettings

    static fromJson(values: any): Wallet {
        const wallet = new Wallet()
        wallet.accounts = values.accounts.map((a) => Account.fromJson(a))
        wallet.folders = values.folders.map((a) => Folder.fromJson(a))
        wallet.settings = {
            simpleLoginApiKey: values.settings?.simpleLoginApiKey || '',
        }
        return wallet
    }
}
