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
    'input[name="mail"]',
    'input[name="login"]',
    'input[name="loginfmt"]',
    'input[name="var_login"]',
    'input[name="username"]',
    'input[name="login_email"]',
    'input[name="account"]',

    'input[id="email"]',
    'input[id="mail"]',
    'input[id="login"]',
    'input[id="loginfmt"]',
    'input[id="var_login"]',
    'input[id="username"]',
    'input[id="login_email"]',
    'input[id="account"]',
    'input[id="account_name_text_field"]',

    'input[type="email"]',

    'input[autocomplete~="email"]',
    'input[autocomplete~="username"]',

    'input[id*="email"]',
    'input[id*="mail"]',
    'input[id*="login"]',
    'input[id*="username"]',
    'input[id*="account"]',
    'input[name*="email"]',
    'input[name*="login"]',
    'input[name*="username"]',
    'input[name*="account"]',

    'input[label*="Email"]', // aliexpress
    'input[placeholder*="email"]',
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
    'button[id*="login"]',
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
    '.webform-component-fieldset',
    '.node-webform',
    'div[id*="login"]',
    'div.login-container', // aliexpress
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

    function sortInputs(inputs) {
        return [
            ...[...inputs].filter((i) => !isHidden(i)),
            ...[...inputs].filter((i) => isHidden(i)),
        ];
    }

    // Get the form by priorities
    let forms = document.querySelectorAll(formSelector)
    forms = [...forms].sort((a, b) => formScore(a) - formScore(b))

    if (selectorsInput2) {
        // Fallback to anything containing a login and password field
        let to_add = document.querySelectorAll(
            `div:has(${selectorsInput2}):has(${selectorsInput1})`
        )
        to_add = [...to_add].sort((a, b) => formScore(a) - formScore(b))
        forms.push(...to_add)

        // Fallback to anything containing a password field
        to_add = document.querySelectorAll(`div:has(${selectorsInput2})`)
        to_add = [...to_add].sort((a, b) => formScore(a) - formScore(b))
        forms.push(...to_add)
    }

    // Fallback to anything containing a login field
    let to_add = document.querySelectorAll(`div:has(${selectorsInput1})`)
    to_add = [...to_add].sort((a, b) => formScore(a) - formScore(b))
    forms.push(...to_add)

    for (const form of forms) {
        const inputs1 = sortInputs(form.querySelectorAll(selectorsInput1.join(',')))
        if (!inputs1?.length) {
            continue
        }
        const input1 = inputs1[0]

        if (!selectorsInput2) {
            input1.value = ''
            return input1
        }

        const inputs2 = sortInputs(form.querySelectorAll(selectorsInput2.join(',')))
        if (inputs2.length) {
            input1.value = ''
            inputs2[0].value = ''
            return [input1, inputs2[0]]
        }
    }
    if (alrt) {
        showAlert('Failed to find the login form')
    }
}

/**
 * Return true if we run on the wallet itself.
 *
 * `chrome.storage.session` is out of reach here (trusted contexts only), but
 * the wallet page's `localStorage` is not, and it holds the key that encrypts
 * the master password kept in that session storage. Staying out of the wallet
 * origin keeps both halves apart.
 */
async function isWalletOrigin() {
    const { lockyUrl } = await chrome.storage.sync.get('lockyUrl')
    try {
        return new URL(lockyUrl).origin === window.location.origin
    } catch {
        return false
    }
}

isWalletOrigin().then((isWallet) => {
    if (isWallet) {
        return
    }

    chrome.runtime.onMessage.addListener(async (message, sender) => {
        // On Firefox the origin holds a random UUID, not `chrome.runtime.id`
        if (`${sender.origin}/` !== chrome.runtime.getURL('/')) {
            console.error(
                'Wrong origin:',
                chrome.runtime.getURL('/'),
                sender.origin
            )
            return
        }

        if (message.action === 'login') {
            const ok = await login(
                message.account.login,
                message.account.password
            )
            if (ok && message.account.totp) {
                showAlert(`${message.account.totp} copied`)
            }
        }
    })
})

async function login(login, password, url) {
    const settings = METHODS[normalizeHost(window.location)] || {}

    console.log("Fill settings:", settings)

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

    console.log("Password input", elPassword)

    if (!elPassword) {
        return false
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
    return true
}

async function _typeText(
    login,
    password,
    loginSelector,
    passwordSelector,
    alrt = true
) {
    const inputs = findInputs(loginSelectors, passwordSelectors, alrt)
    console.log("inputs", inputs)
    if (!inputs) {
        return
    }

    const [elLogin, elPassword] = inputs

    elLogin.focus()
    if (document.activeElement === elLogin) {
        document.execCommand('insertText', false, login)
    } else {
        elLogin.value = login
    }

    elPassword.focus()
    if (document.activeElement === elPassword) {
        document.execCommand('insertText', false, password)
    } else {
        return null
    }
    return elPassword
}

async function _setAttribute(
    login,
    password,
    loginSelectors,
    passwordSelectors
) {
    const inputs = findInputs(loginSelectors, passwordSelectors)
    if (!inputs) {
        return
    }
    const [elLogin, elPassword] = inputs

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
    if (document.activeElement === elLogin) {
        document.execCommand('insertText', false, login)
    } else {
        elLogin.value = login
    }

    const submit = elLogin
        .closest(formSelector)
        .querySelector(submitSelectors.join(','))

    if (!submit) {
        return
    }

    submit.click()

    const elPassword = await waitFocusableInput(passwordSelectors)

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
    if (document.activeElement === elLogin) {
        document.execCommand('insertText', false, login)
    } else {
        elLogin.value = login
    }

    await sleep(200)
    await enter(elLogin)

    const elPassword = await waitFocusableInput(passwordSelectors)

    elPassword.focus()
    document.execCommand('insertText', false, password)
    await sleep(200)

    return elPassword
}

async function _twitter(login, password) {
    console.log("_twitter")
    if (document.location.origin !== 'https://x.com') {
        showAlert('Failed to find the login form')
        return
    }

    const elLogin = await waitFocusableInput(['input[autocomplete*="username"]', 'input[name="email"]']);
    console.log("Login input", elLogin)
    if (!elLogin) {
        showAlert('Failed to find the login form')
        return
    }

    document.execCommand('insertText', false, login)
    await sleep(500)

    const submit = elLogin
        .closest(formSelector)
        .querySelector(submitSelectors.join(','))
    console.log("Submit button:", submit)
    if (!submit) {

        return
    }
    submit.click()

    // Twitter has no `<form/>`
    const elPassword = await waitFocusableInput(['input[type="password"]']);
    if (!elPassword) {
        showAlert('Failed to find the login form')
        return
    }

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

async function waitFocusableInput(passwordSelectors) {
    let el = null
    for (let i = 0; i < 40; ++i) {
        el = findInputs(passwordSelectors, null, false)
        // Google, Paypal have a hidden input password in its form
        if (el && !isHidden(el)) {
            el.focus()
            if (document.activeElement === el) {
                return el
            }
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
                left: 50%;
                transform: translate(-50%, 0%);
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
    return el.offsetParent === null || el.type === "hidden"
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
