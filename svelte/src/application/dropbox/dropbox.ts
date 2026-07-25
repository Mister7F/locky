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
const CODE_VERIFIER_KEY = 'dropboxCodeVerifier'
const AUTH_STATE_KEY = 'dropboxAuthState'
const POPUP_CALLBACK_KEY = 'dropboxPopupCallback'

let connection: any | undefined
let connectionPromise: Promise<any | undefined> | undefined
let pendingRefreshToken: string | undefined

const redirectUrl = (
    document.location.origin + document.location.pathname
).replace(/\/+$/, '')

async function getAuthenticationUrl(state: string): Promise<string> {
    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID })
    const authUrl = await dbx.auth.getAuthenticationUrl(
        redirectUrl,
        state,
        'code',
        'offline',
        undefined,
        undefined,
        true
    )
    window.sessionStorage.setItem(CODE_VERIFIER_KEY, dbx.auth.codeVerifier)
    return authUrl
}

export async function openAuthenticationPage(): Promise<void> {
    const authenticationWindow = window.open(
        '',
        'dropbox-auth',
        'popup,width=600,height=700'
    )
    if (!authenticationWindow) {
        throw new Error('Could not open the Dropbox authentication page')
    }

    try {
        const state = crypto.randomUUID()
        window.sessionStorage.setItem(AUTH_STATE_KEY, state)
        const authenticationUrl = await getAuthenticationUrl(state)
        authenticationWindow.sessionStorage.setItem(POPUP_CALLBACK_KEY, 'true')
        authenticationWindow.opener = null
        authenticationWindow.location.href = authenticationUrl
        await completePopupAuthentication(authenticationWindow, state)
    } catch (error) {
        authenticationWindow.close()
        throw error
    }
}

export async function isAuthenticated(): Promise<boolean> {
    const dbx = await getConnection()
    if (dbx) {
        await persistRefreshToken()
    }
    return !!dbx
}

export async function logout() {
    const dbx = connection
    if (dbx) {
        dbx.authTokenRevoke().catch(console.error)
    }
    connection = undefined
    connectionPromise = undefined
    pendingRefreshToken = undefined
    window.sessionStorage.removeItem(CODE_VERIFIER_KEY)
    window.sessionStorage.removeItem(AUTH_STATE_KEY)
    const wallet = await api.setDropboxRefreshToken('')
    setDropboxHash('')
    return wallet
}

export async function listDir(): Promise<any> {
    const dbx = await getConnection()
    const response = await dbx.filesListFolder({ path: '' })
    return response.result.entries as DropboxEntry[]
}

export async function fileExist(filename: string): Promise<any> {
    const files = await listDir()
    const file = files && files.find((f: any) => f.name === filename)
    if (file) {
        return file
    }
    return
}

export async function download(
    filename: string
): Promise<DropboxDownload | undefined> {
    const dbx = await getConnection()

    const response = await dbx.filesDownload({ path: '/' + filename })
    if (response.status !== 200) {
        return
    }

    return {
        content: await response.result.fileBlob.arrayBuffer(),
        hash: response.result.content_hash,
        rev: response.result.rev,
    }
}

export async function upload(
    filename: string,
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
            path: '/' + filename,
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

    return response && response.status === 200
}

export async function getConnection(): Promise<any | undefined> {
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
    window.localStorage.removeItem('dropboxAccessToken')
    window.localStorage.removeItem('dropboxRefreshToken')

    const codeFromUrl = getCodeFromUrl()
    if (codeFromUrl) {
        if (window.sessionStorage.getItem(POPUP_CALLBACK_KEY)) {
            return
        }

        const callbackState = new URL(window.location.href).searchParams.get(
            'state'
        )
        if (callbackState !== window.sessionStorage.getItem(AUTH_STATE_KEY)) {
            window.history.replaceState(null, '', redirectUrl)
            return
        }

        try {
            await exchangeAuthorizationCode(codeFromUrl)
        } finally {
            window.history.replaceState(null, '', redirectUrl)
        }
        return connection
    }

    const refreshToken =
        pendingRefreshToken || api.getDropboxRefreshToken() || undefined
    if (!refreshToken) {
        return
    }

    pendingRefreshToken = refreshToken
    connection = new Dropbox.Dropbox({
        clientId: CLIENT_ID,
        refreshToken,
    })
    return connection
}

export async function persistRefreshToken(): Promise<Wallet | undefined> {
    const refreshToken =
        pendingRefreshToken || connection?.auth.getRefreshToken()
    if (!refreshToken || refreshToken === api.getDropboxRefreshToken()) {
        return
    }
    return await api.setDropboxRefreshToken(refreshToken)
}

export function getCodeFromUrl(): string | undefined {
    return new URL(window.location.href).searchParams.get('code') || undefined
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
    window.sessionStorage.removeItem(CODE_VERIFIER_KEY)
    window.sessionStorage.removeItem(AUTH_STATE_KEY)
}

async function exchangeAuthorizationCode(code: string): Promise<void> {
    const codeVerifier = window.sessionStorage.getItem(CODE_VERIFIER_KEY)
    if (!codeVerifier) {
        throw new Error('Missing Dropbox PKCE code verifier')
    }

    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID })
    dbx.auth.setCodeVerifier(codeVerifier)
    let token
    try {
        token = await dbx.auth.getAccessTokenFromCode(redirectUrl, code)
    } finally {
        window.sessionStorage.removeItem(CODE_VERIFIER_KEY)
        window.sessionStorage.removeItem(AUTH_STATE_KEY)
    }

    if (token.status !== 200 || !token.result.refresh_token) {
        throw new Error('Dropbox did not return a refresh token')
    }

    pendingRefreshToken = token.result.refresh_token
    connection = new Dropbox.Dropbox({
        clientId: CLIENT_ID,
        accessToken: token.result.access_token,
        accessTokenExpiresAt: new Date(
            Date.now() + token.result.expires_in * 1000
        ),
        refreshToken: pendingRefreshToken,
    })
}

export function setDropboxHash(hash: string, rev: string = '') {
    window.localStorage.setItem('dropboxHash', hash)
    window.localStorage.setItem('dropboxRev', rev)
}

export function getDropboxHash(hash?: string): string | undefined {
    return window.localStorage.getItem('dropboxHash')
}
