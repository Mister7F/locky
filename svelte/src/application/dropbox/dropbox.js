const CLIENT_ID = 'c53nc5eenquwokp';

let accessToken = null;

export async function getAuthenticationUrl() {
    const redirectUrl = document.location.href.replace(/\/+$/, '');

    const dbx = new Dropbox.Dropbox({ clientId: CLIENT_ID });
    const authUrl = await dbx.auth.getAuthenticationUrl(redirectUrl);
    return authUrl;
}

export function isAuthenticated() {
    accessToken = getAccessToken();
    return !!accessToken;
}

export function logout() {
    accessToken = null;
    localStorage.removeItem('dropboxAccessToken');
}

export async function listDir() {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });
    const response = await dbx.filesListFolder({ path: '' });
    return response.result.entries;
}

export async function fileExist(filename) {
    const files = await listDir();
    const file = files && files.find((f) => f.name === filename);
    if (file) {
        return file.name;
    }
    return false;
}

export async function download(filename) {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });

    const response = await dbx.filesDownload({ path: '/' + filename });
    if (response.status !== 200) {
        return null;
    }

    const fileName = response.result;

    console.log('Dropbox: download:', fileName);

    const fileContent = await response.result.fileBlob.arrayBuffer();

    return fileContent;
}

export async function upload(filename, content) {
    const dbx = new Dropbox.Dropbox({ accessToken: getAccessToken() });

    let response;
    try {
        response = await dbx.filesUpload({
            path: '/' + filename,
            contents: content,
            mode: 'overwrite',
        });
    } catch (error) {
        console.error(error);
        return false;
    }
    return response && response.status === 200;
}

export function getAccessToken() {
    const accessTokenFromUrl = getAccessTokenFromUrl();
    if (accessTokenFromUrl) {
        localStorage.setItem('dropboxAccessToken', accessTokenFromUrl);
        return accessTokenFromUrl;
    }
    return localStorage.getItem('dropboxAccessToken');
}

export function getAccessTokenFromUrl() {
    const url = window.location.hash;
    if (!url) {
        return null;
    }
    const parameters = url.split('&');
    let accessTokenParam = parameters.find((p) => p.indexOf('access_token=') === 0);
    if (!accessTokenParam) {
        return null;
    }
    accessTokenParam = accessTokenParam.split('=');
    const accessToken =
        accessTokenParam && accessTokenParam.length === 2 ? accessTokenParam[1] : null;
    window.location.hash = '';
    return accessToken && accessToken.length ? accessToken : null;
}
