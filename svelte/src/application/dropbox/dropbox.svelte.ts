import * as api from '../api.ts'
import type Wallet from '../../models/wallet.ts'

declare const Dropbox: any

type DropboxEntry = {
    name: string
    content_hash?: string
}

export type DropboxDownload = {
    content: ArrayBuffer
    hash: string
    rev: string
}

const CLIENT_ID = 'c53nc5eenquwokp'
const WALLET_FILE = 'wallet.lck'

let connection: any | undefined
let connectionPromise: Promise<any | undefined> | undefined
let codeVerifier: string | undefined
const state = $state({ authenticated: false })

const redirectUrl = (
    document.location.origin + document.location.pathname
).replace(/\/+$/, '')

async function openAuthenticationPage(): Promise<void> {
    const authenticationWindow = window.open(
        '',
        'dropbox-auth',
        'popup,width=600,height=700'
    )
    if (!authenticationWindow) {
        throw new Error('Could not open the Dropbox authentication page')
    }

    try {
        const expectedState = crypto.randomUUID()
        const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID })
        const authenticationUrl = await dbx.auth.getAuthenticationUrl(
            redirectUrl,
            expectedState,
            'code',
            'offline',
            undefined,
            undefined,
            true
        )
        codeVerifier = dbx.auth.codeVerifier
        authenticationWindow.opener = null
        authenticationWindow.location.href = authenticationUrl
        await completePopupAuthentication(authenticationWindow, expectedState)
    } catch (error) {
        authenticationWindow.close()
        codeVerifier = undefined
        throw error
    }
}

async function refresh(): Promise<boolean> {
    const dbx = await getConnection()
    if (dbx) {
        await persistRefreshToken()
    }
    state.authenticated = !!dbx
    return state.authenticated
}

async function login(): Promise<void> {
    await openAuthenticationPage()
    await refresh()
}

async function logout() {
    const dbx = connection
    if (dbx) {
        dbx.authTokenRevoke().catch(console.error)
    }
    connection = undefined
    connectionPromise = undefined
    codeVerifier = undefined
    const wallet = await api.setDropboxRefreshToken('')
    window.localStorage.removeItem('dropboxHash')
    window.localStorage.removeItem('dropboxRev')
    state.authenticated = false
    return wallet
}

async function getRemoteWalletHash(): Promise<string | undefined> {
    const dbx = await getConnection()
    const response = await dbx.filesListFolder({ path: '' })
    return (response.result.entries as DropboxEntry[]).find(
        (file) => file.name === WALLET_FILE
    )?.content_hash
}

async function downloadWallet(): Promise<DropboxDownload | undefined> {
    const dbx = await getConnection()

    const response = await dbx.filesDownload({ path: `/${WALLET_FILE}` })
    if (response.status !== 200) {
        return
    }

    return {
        content: await response.result.fileBlob.arrayBuffer(),
        hash: response.result.content_hash,
        rev: response.result.rev,
    }
}

async function replaceWalletFromDropbox(): Promise<Wallet | undefined> {
    const download = await downloadWallet()
    if (!download) {
        return
    }

    const wallet = await api.replaceWallet(download.content)
    if (!wallet) {
        return
    }

    useDownloadedWallet(download, wallet)
    return wallet
}

function useDownloadedWallet(download: DropboxDownload, wallet: Wallet): void {
    setDropboxHash(download.hash, download.rev)
    connection = undefined
    connectionPromise = undefined
    state.authenticated = !!wallet.settings.dropboxRefreshToken
}

async function uploadWallet(
    content: ArrayBuffer | Uint8Array,
    overwrite: boolean = false
): Promise<boolean> {
    const dbx = await getConnection()

    // Overwrite only the revision we last synced with, so a wallet
    // changed from another device in the meantime is not clobbered.
    const rev = window.localStorage.getItem('dropboxRev')

    let response
    try {
        response = await dbx.filesUpload({
            path: `/${WALLET_FILE}`,
            contents: content,
            mode:
                !overwrite && rev
                    ? { '.tag': 'update', update: rev }
                    : 'overwrite',
        })
    } catch (error) {
        console.error(error)
        return false
    }

    setDropboxHash(response.result.content_hash, response.result.rev)

    return response.status === 200
}

async function getConnection(): Promise<any | undefined> {
    if (connection) {
        return connection
    }
    if (!connectionPromise) {
        connectionPromise = createConnection().finally(() => {
            connectionPromise = undefined
        })
    }
    return connectionPromise
}

async function createConnection(): Promise<any | undefined> {
    const refreshToken = api.getDropboxRefreshToken() || undefined
    if (!refreshToken) {
        return
    }

    connection = new Dropbox.Dropbox({
        clientId: CLIENT_ID,
        refreshToken,
    })
    return connection
}

async function persistRefreshToken(): Promise<void> {
    const refreshToken = connection?.auth.getRefreshToken()
    if (!refreshToken || refreshToken === api.getDropboxRefreshToken()) {
        return
    }
    await api.setDropboxRefreshToken(refreshToken)
}

async function completePopupAuthentication(
    authenticationWindow: Window,
    expectedState: string
): Promise<void> {
    while (!authenticationWindow.closed) {
        try {
            const callbackUrl = new URL(authenticationWindow.location.href)
            if (callbackUrl.origin === window.location.origin) {
                const code = callbackUrl.searchParams.get('code')
                const state = callbackUrl.searchParams.get('state')
                if (!code || state !== expectedState) {
                    throw new Error('Invalid Dropbox OAuth callback')
                }

                authenticationWindow.close()
                await exchangeAuthorizationCode(code)
                await persistRefreshToken()
                return
            }
        } catch (error) {
            if (!(error instanceof DOMException)) {
                authenticationWindow.close()
                throw error
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 250))
    }
    codeVerifier = undefined
}

async function exchangeAuthorizationCode(code: string): Promise<void> {
    if (!codeVerifier) {
        throw new Error('Missing Dropbox PKCE code verifier')
    }

    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID })
    dbx.auth.setCodeVerifier(codeVerifier)
    let token
    try {
        token = await dbx.auth.getAccessTokenFromCode(redirectUrl, code)
    } finally {
        codeVerifier = undefined
    }

    if (token.status !== 200 || !token.result.refresh_token) {
        throw new Error('Dropbox did not return a refresh token')
    }

    connection = new Dropbox.Dropbox({
        clientId: CLIENT_ID,
        accessToken: token.result.access_token,
        accessTokenExpiresAt: new Date(
            Date.now() + token.result.expires_in * 1000
        ),
        refreshToken: token.result.refresh_token,
    })
}

function setDropboxHash(hash: string, rev: string) {
    window.localStorage.setItem('dropboxHash', hash)
    window.localStorage.setItem('dropboxRev', rev)
}

function getDropboxHash(): string {
    return window.localStorage.getItem('dropboxHash') || ''
}

export default {
    get authenticated() {
        return state.authenticated
    },
    set authenticated(value: boolean) {
        state.authenticated = value
    },
    refresh,
    login,
    logout,
    getRemoteWalletHash,
    downloadWallet,
    replaceWalletFromDropbox,
    useDownloadedWallet,
    uploadWallet,
    getDropboxHash,
}
