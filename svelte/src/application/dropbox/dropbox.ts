declare const Dropbox: any

type DropboxEntry = {
    name: string
    content_hash?: string
}

const CLIENT_ID = 'c53nc5eenquwokp'

let accessToken: string | undefined = undefined

const redirectUrl = (
    document.location.origin + document.location.pathname
).replace(/\/+$/, '')

export async function getAuthenticationUrl(): Promise<string> {
    const state = undefined
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
    window.localStorage.setItem('dropboxCodeVerifier', dbx.auth.codeVerifier)
    return authUrl
}

export async function isAuthenticated(): Promise<boolean> {
    accessToken = await getConnection()
    return !!accessToken
}

export function logout() {
    accessToken = undefined
    setDropboxHash('')
    localStorage.setItem('dropboxAccessToken', '')
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
): Promise<ArrayBuffer | undefined> {
    const dbx = await getConnection()

    const response = await dbx.filesDownload({ path: '/' + filename })
    if (response.status !== 200) {
        return
    }

    setDropboxHash(response.result.content_hash)

    const fileContent = await response.result.fileBlob.arrayBuffer()

    return fileContent
}

export async function upload(
    filename: string,
    content: ArrayBuffer | Uint8Array
): Promise<boolean> {
    const dbx = await getConnection()

    let response
    try {
        response = await dbx.filesUpload({
            path: '/' + filename,
            contents: content,
            mode: 'overwrite',
        })
    } catch (error) {
        console.error(error)
        return false
    }

    setDropboxHash(response.result.content_hash)

    return response && response.status === 200
}

export async function getConnection(): Promise<any | undefined> {
    const codeFromUrl = getCodeFromUrl()
    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID })
    if (codeFromUrl) {
        // authentication process just happened, fetch the access token
        // and the refresh token from the code in the URL
        dbx.auth.setCodeVerifier(
            window.localStorage.getItem('dropboxCodeVerifier')
        )
        const token = await dbx.auth.getAccessTokenFromCode(
            redirectUrl,
            codeFromUrl
        )

        if (token.status !== 200) {
            console.error(token)
            return
        }

        localStorage.setItem('dropboxAccessToken', token.result.access_token)
        localStorage.setItem('dropboxRefreshToken', token.result.refresh_token)

        // refresh the page
        document.location = redirectUrl
        return
    }

    const accessToken = localStorage.getItem('dropboxAccessToken')
    const refreshToken = localStorage.getItem('dropboxRefreshToken')

    if (!accessToken || !refreshToken) {
        return
    }

    dbx.auth.setAccessToken(accessToken)
    dbx.auth.setRefreshToken(refreshToken)

    return dbx
}

export function getCodeFromUrl(): string | undefined {
    const url = window.location.search
    if (!url) {
        return
    }
    const parameters = url.split('&')
    const codeParamValue = parameters.find((p) => p.includes('code='))
    if (!codeParamValue) {
        return
    }
    const codeParam = codeParamValue.split('=')
    const code = codeParam.length === 2 ? codeParam[1] : null
    window.location.hash = ''
    return code && code.length ? code : undefined
}

export function setDropboxHash(hash: string) {
    window.localStorage.setItem('dropboxHash', hash)
}

export function getDropboxHash(hash?: string): string | undefined {
    return window.localStorage.getItem('dropboxHash')
}
