// chrome.storage.session
//     .get().catch()
//     .then((x) => alert('Should not be able to access storage session!'))

const METHODS = {
    // Amazon
    'amazon.fr': { fill: 'set_attribute' },
    'amazon.be': { fill: 'set_attribute' },
    'amazon.com': { fill: 'set_attribute' },
    'amazon.de': { fill: 'set_attribute' },
    // Microsoft
    'login.live.com': { fill: 'write_submit_write' },
    'login.microsoftonline.com': { fill: 'write_submit_write' },
    // Other
    'github.com': { fill: 'set_attribute', submit: 'submit' },
}

const loginSelectors = [
    'input[name="email"]',
    'input[name="login"]',
    'input[name="loginfmt"]',
    'input[id="username"]',
    'input[autocomplete="username"]',
]
const passwordSelectors = [
    'input[id="password"]',
    'input[type="password"]',
    'input[autocomplete="current-password"]',
]
const submitSelectors = [
    'button[name="login"]',
    'button[type="submit"]',
    'input[type="submit"]',
    'button[data-a-target="passport-login-button"]',
    'a[data-a-target="passport-login-button"]',
]

const totpSelectors = [
    'input[name="otpCode"]',
    'input[autocomplete="one-time-code"]',
    'input[placeholder="6-digit authentication code"]',
    'input[id="app_otp"]',
    'input[name="app_otp"]',
    'input[name="otc"]',
]

function findInputs(selectorsInput1, selectorsInput2 = null) {
    const selector1 = selectorsInput1.map((sel) => `form ${sel}`).join(',')
    const inputs1 = document.querySelectorAll(selector1)
    if (!selectorsInput2) {
        if (!inputs1?.length) {
            alert('Failed to find the input')
            return
        }
        const input1 = inputs1[0]
        input1.value = ''
        return [input1]
    }

    const selector2 = selectorsInput2.join(',')
    for (let input1 of inputs1) {
        const form = input1.closest('form')
        const input2 = form.querySelector(selector2)
        if (input2) {
            input1.value = ''
            input2.value = ''
            return [input1, input2]
        }
    }

    alert('Failed to find the input')
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (
        sender.origin !== `moz-extension://${chrome.runtime.id}` &&
        sender.origin !== `chrome-extension://${chrome.runtime.id}`
    ) {
        return
    }

    if (message.action === 'login') {
        if (message.account.url?.length) {
            const walletHost = normalizeHost(message.account.url)
            const currentHost = normalizeHost(window.location)

            if (
                walletHost !== currentHost &&
                !confirm(
                    `The current domain (${currentHost}) does not match the URL in your wallet (${walletHost}), are you sure you are not phished?`
                )
            ) {
                return
            }
        }
        await login(message.account.login, message.account.password)
    }
})

async function login(login, password, url) {
    const settings = METHODS[normalizeHost(window.location)] || {}

    let elPassword

    if (settings.fill === 'set_attribute') {
        elPassword = await _setAttribute(
            login,
            password,
            loginSelectors,
            passwordSelectors
        )
    } else if (settings.fill === 'write_submit_write') {
        elPassword = await _writeSubmitWrite(
            login,
            password,
            loginSelectors,
            passwordSelectors
        )
    } else {
        elPassword = await _typeText(
            login,
            password,
            loginSelectors,
            passwordSelectors
        )
    }

    if (settings.submit === 'enter') {
        await enter(elPassword)
    } else if (settings.submit === 'submit') {
        elPassword.closest('form').submit()
    } else {
        await sleep(50)
        elPassword
            .closest('form')
            .querySelector(submitSelectors.join(','))
            .click()
    }
}

async function _typeText(login, password, loginSelector, passwordSelector) {
    const [elLogin, elPassword] = findInputs(loginSelectors, passwordSelectors)

    elLogin.focus()
    document.execCommand('insertText', false, login)
    elPassword.focus()
    document.execCommand('insertText', false, password)
    return elPassword
}

async function _setAttribute(
    login,
    password,
    loginSelectors,
    passwordSelectors
) {
    const [elLogin, elPassword] = findInputs(loginSelectors, passwordSelectors)

    elLogin.value = login
    elPassword.value = password
    return elPassword
}

async function _writeSubmitWrite(
    login,
    password,
    loginSelectors,
    passwordSelectors
) {
    const [elLogin] = findInputs(loginSelectors)

    elLogin.focus()
    document.execCommand('insertText', false, login)

    elLogin.closest('form').querySelector(submitSelectors.join(',')).click()

    await sleep(1000)

    const [elPassword] = findInputs(passwordSelectors)

    elPassword.focus()
    document.execCommand('insertText', false, password)

    return elPassword
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function enter(input) {
    const keydown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
    })
    const keypress = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
    })
    await sleep(100)
    input.dispatchEvent(keydown)
    await sleep(100)
    input.dispatchEvent(keypress)
}

// From Locky
function normalizeHost(url) {
    if (!url) {
        return ''
    }
    let origin
    try {
        origin = new URL(url).host
    } catch {
        return ''
    }
    if (origin.startsWith('www.')) {
        return origin.slice(4)
    }
    return origin || ''
}
