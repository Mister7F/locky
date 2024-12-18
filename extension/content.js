// chrome.storage.session
//     .get().catch()
//     .then((x) => alert('Should not be able to access storage session!'))

const METHODS = {
    // Amazon
    'amazon.fr': { fill: 'set_attribute', submit: 'submit' },
    'amazon.com': { fill: 'set_attribute', submit: 'submit' },
    'amazon.com.be': { fill: 'set_attribute', submit: 'submit' },
    'amazon.de': { fill: 'set_attribute', submit: 'submit' },
    // Microsoft
    'login.live.com': { fill: 'write_submit_write', submit: 'click' },
    'login.microsoftonline.com': {
        fill: 'write_submit_write',
        submit: 'click',
    },
    // Google
    'accounts.google.com': { fill: 'write_enter_write', submit: 'enter' },
    // Other
    'github.com': { fill: 'set_attribute', submit: 'submit' },
    'paypal.com': { fill: 'write_submit_write' },
    'x.com': { fill: 'twitter', submit: 'enter' },
}

const loginSelectors = [
    'input[name="email"]',
    'input[name="login"]',
    'input[name="loginfmt"]',
    'input[name="var_login"]',
    'input[name="username"]',
    'input[name="login_email"]',

    'input[id="email"]',
    'input[id="login"]',
    'input[id="loginfmt"]',
    'input[id="var_login"]',
    'input[id="username"]',
    'input[id="login_email"]',
    'input[id="account_name_text_field"]',

    'input[type="email"]',

    'input[autocomplete="email"]',
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
    'button[id="sign-in"]',
]

const totpSelectors = [
    'input[name="otpCode"]',
    'input[autocomplete="one-time-code"]',
    'input[placeholder="6-digit authentication code"]',
    'input[id="app_otp"]',
    'input[name="app_otp"]',
    'input[name="otc"]',
]

const formSelectors = [
    'form',
    'apple-auth', // Apple
    'sign-in',
    'div[id="sign_in_form"]',
    'div[id="loginBloc"]', // SWDE
    '.login-screen', // SWDE
    '.webform-component-fieldset',
    '.node-webform',
    '*[id*="login"]',
]
const formSelector = formSelectors.join(',')

function findInputs(selectorsInput1, selectorsInput2 = null, alrt = true) {
    function formScore(form) {
        if (form.querySelectorAll(passwordSelectors.join(',')).length === 1) {
            // Form with 1 and only one password field (2 might be sign up form)
            return 0
        }
        return 1
    }

    // Get the form by priorities
    const forms = [...document.querySelectorAll(formSelector)].sort(
        (a, b) => formScore(a) - formScore(b)
    )

    for (const form of forms) {
        const inputs1 = form.querySelectorAll(selectorsInput1.join(','))
        if (!selectorsInput2) {
            if (!inputs1?.length) {
                continue
            }
            const input1 = inputs1[0]
            input1.value = ''
            return input1
        }

        const selector2 = selectorsInput2.join(',')
        for (const input1 of inputs1) {
            const input2 = form.querySelector(selector2)
            if (input2) {
                input1.value = ''
                input2.value = ''
                return [input1, input2]
            }
        }
    }
    if (alrt) {
        showAlert('Failed to find the login form')
    }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (
        sender.origin !== `moz-extension://${chrome.runtime.id}` &&
        sender.origin !== `chrome-extension://${chrome.runtime.id}` &&
        `${sender.origin}/` !== chrome.runtime.getURL('/')
    ) {
        console.error(
            'Wrong origin:',
            chrome.runtime.id,
            chrome.runtime.getURL('/'),
            sender.origin
        )
        return
    }

    if (message.action === 'login') {
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
    } else if (settings.fill === 'write_enter_write') {
        elPassword = await _writeEnterWrite(
            login,
            password,
            loginSelectors,
            passwordSelectors
        )
    } else if (settings.fill === 'twitter') {
        elPassword = await _twitter(login, password)
    } else if (settings.fill === 'type_text') {
        elPassword = await _typeText(
            login,
            password,
            loginSelectors,
            passwordSelectors
        )
    } else {
        // Auto mode
        elPassword = await _typeText(
            login,
            password,
            loginSelectors,
            passwordSelectors,
            false
        )
        if (!elPassword) {
            elPassword = await _writeSubmitWrite(
                login,
                password,
                loginSelectors,
                passwordSelectors
            )
        }
    }

    if (settings.submit === 'click') {
        await sleep(50)
        elPassword
            .closest(formSelector)
            .querySelector(submitSelectors.join(','))
            .click()
    } else if (settings.submit === 'submit') {
        elPassword.closest(formSelector).submit()
    } else if (settings.submit === 'enter') {
        await sleep(50)
        await enter(elPassword)
    } else {
        await sleep(50)
        if (!sendClick(elPassword)) {
            await enter(elPassword)
        }
    }
}

async function _typeText(
    login,
    password,
    loginSelector,
    passwordSelector,
    alrt = true
) {
    const inputs = findInputs(loginSelectors, passwordSelectors, alrt)
    if (!inputs) {
        return
    }

    const [elLogin, elPassword] = inputs

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
    passwordSelectors,
    alrt = true
) {
    const elLogin = findInputs(loginSelectors, null, alrt)

    elLogin.focus()
    document.execCommand('insertText', false, login)

    const submit = elLogin
        .closest(formSelector)
        .querySelector(submitSelectors.join(','))

    if (!submit) {
        return
    }

    submit.click()

    const elPassword = await waitPasswordInput(passwordSelectors)

    elPassword.focus()
    document.execCommand('insertText', false, password)

    return elPassword
}

async function _writeEnterWrite(
    login,
    password,
    loginSelectors,
    passwordSelectors
) {
    const elLogin = findInputs(loginSelectors)

    elLogin.focus()
    document.execCommand('insertText', false, login)

    await sleep(200)
    await enter(elLogin)

    const elPassword = await waitPasswordInput(passwordSelectors)

    elPassword.focus()
    document.execCommand('insertText', false, password)
    await sleep(200)

    return elPassword
}

async function _twitter(login, password) {
    if (
        document.location.origin !== 'https://x.com' ||
        !document.location.pathname.includes('/login')
    ) {
        showAlert('Failed to find the login form')
        return
    }

    let elLogin = document.querySelector('input[autocomplete="username"]')
    if (!elLogin) {
        elLogin = document.querySelector('input[name="text"]')
    }
    if (!elLogin) {
        showAlert('Failed to find the login form')
        return
    }

    elLogin.focus()
    document.execCommand('insertText', false, login)
    await sleep(500)

    await enter(elLogin)

    // Twitter has no `<form/>`
    const elPassword = null
    for (let i = 0; i < 30; i++) {
        elPassword = document.querySelector('input[type="password"]')
        if (elPassword) {
            break
        }
        await sleep(200)
    }

    elPassword.focus()
    document.execCommand('insertText', false, password)
    await sleep(500)

    return elPassword
}

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function enter(input) {
    input.focus()
    const keydown = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
        bubbles: true,
        view: window,
    })
    const keypress = new KeyboardEvent('keypress', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
        bubbles: true,
        view: window,
    })
    const keypup = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        which: 13,
        keyCode: 13,
        bubbles: true,
        view: window,
    })
    await sleep(100)
    input.dispatchEvent(keydown)
    await sleep(100)
    input.dispatchEvent(keypress)
    await sleep(100)
    input.dispatchEvent(keypup)
}

async function waitPasswordInput(passwordSelectors) {
    let elPassword = null
    for (let i = 0; i < 40; ++i) {
        elPassword = findInputs(passwordSelectors, null, false)
        // Google, Paypal have a hidden input password in its form
        if (elPassword && !isHidden(elPassword)) {
            return elPassword
        }
        await sleep(100)
    }
}

function sendClick(elPassword) {
    const form = elPassword.closest(formSelector)
    if (!form) {
        return false
    }
    const submit = form.querySelector(submitSelectors.join(','))
    if (!submit) {
        return false
    }
    submit.click()
    return true
}

function showAlert(message) {
    let alrt = document.querySelector('.locky-alert')

    if (!alrt) {
        alrt = createElementFromHTML(`
            <div class="locky-alert" style="
                position: absolute;
                color: white;
                border: 1px solid red;
                z-index: 9999999;
                top: 20px;
                right: 20px;
                text-align: right;
                padding: 20px;
                background-color: #292c35;
                border-radius: 10px;
                font-size: 20px;
                font-family: monospace;
                display: flex;
                align-items: baseline;
        ">
        </div>`)
    }
    alrt.innerText = message
    document.body.appendChild(alrt)
    setTimeout(() => {
        document.querySelector('.locky-alert').remove()
    }, 2500)
}

function isHidden(el) {
    // https://stackoverflow.com/questions/19669786/check-if-element-is-visible-in-dom
    return el.offsetParent === null
}

function createElementFromHTML(htmlString) {
    const div = document.createElement('div')
    div.innerHTML = htmlString.trim()
    return div.firstChild
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
