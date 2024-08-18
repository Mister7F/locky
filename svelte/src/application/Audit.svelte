<!--
    Make some HTTP request to haveibeenpwned to know if one of the passwords has been leaked.
    Only a part of the hash is sent so it will not leak the account passwords.

    See https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 -->
<script>
    import Button from '../helpers/Button.svelte'
    import AccountCard from './AccountCard.svelte'
    import Icon from '../helpers/Icon.svelte'

    import { digest, passwordStrength } from '../helpers/crypto.js'

    const url = 'https://api.pwnedpasswords.com/range/'

    let { wallet, onedit } = $props()

    let loading = $state(false)
    let leakedAccountsIndex = $state([])
    let weakAccountsIndex = $state([])
    let duplicatedIndex = $state([])

    async function isPasswordLeaked(password) {
        const hash = await digest(password)
        const shortHash = hash.slice(0, 5)
        const suffixHash = hash.slice(5)

        let response
        try {
            response = await window.fetch(url + shortHash)
            if (!response.ok) {
                return false
            }
        } catch {
            return false
        }

        const responseText = await response.text()
        return responseText.includes(suffixHash)
    }

    async function onStartAudit() {
        loading = true
        leakedAccountsIndex = []
        weakAccountsIndex = []

        const passwords = wallet.accounts
            .map((account) => account.password)
            .filter((password) => password && password.length)
            .filter((v, i, a) => a.indexOf(v) === i) // keep only unique values

        const leakedPassword = []
        for (const password of passwords) {
            if (await isPasswordLeaked(password)) {
                leakedPassword.push(password)
            }
        }

        for (let i = 0; i < wallet.accounts.length; i++) {
            if (leakedPassword.includes(wallet.accounts[i].password)) {
                leakedAccountsIndex.push(i)
            }

            if (
                wallet.accounts[i].password?.length &&
                passwordStrength(wallet.accounts[i].password) < 90
            ) {
                weakAccountsIndex.push(i)
            }
        }

        // find duplicated passwords
        const seen = {}
        const _duplicatedIndex = new Set()
        for (let i = 0; i < wallet.accounts.length; i++) {
            const password = wallet.accounts[i].password
            if (!password?.length) {
                continue
            }
            if (seen[password]) {
                _duplicatedIndex.add(i)
                _duplicatedIndex.add(seen[password])
            }
            seen[password] = i
        }

        leakedAccountsIndex = leakedAccountsIndex
        weakAccountsIndex = weakAccountsIndex
        duplicatedIndex = [..._duplicatedIndex]

        loading = false
    }
</script>

<div class="audit">
    <Button
        class="audit-loading"
        color="secondary"
        onclick={onStartAudit}
        disabled={loading}
        icon={loading && 'sync'}
    >
        Start auditing
    </Button>
    <br />

    {#if leakedAccountsIndex.length}
        <span class="title">
            The passwords of those accounts have been
            <a href="https://haveibeenpwned.com/Passwords" target="_blank"
                >leaked</a
            >, you must change them!
        </span>
        <div class="container">
            {#each leakedAccountsIndex as accountIndex, index}
                <div {index}>
                    <AccountCard
                        account={wallet.accounts[accountIndex]}
                        onclick={() => onedit(wallet.accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if weakAccountsIndex.length}
        <span class="title">
            The passwords of those accounts are
            <a href="https://github.com/dropbox/zxcvbn" target="_blank">weak</a>
            and must be changed!
        </span>
        <div class="container">
            {#each weakAccountsIndex as accountIndex, index}
                <div {index}>
                    <AccountCard
                        account={wallet.accounts[accountIndex]}
                        onclick={() => onedit(wallet.accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if duplicatedIndex.length}
        <span class="title">
            The passwords of those accounts are re-used and must be changed!
        </span>
        <div class="container">
            {#each duplicatedIndex as accountIndex, index}
                <div {index}>
                    <AccountCard
                        account={wallet.accounts[accountIndex]}
                        onclick={() => onedit(wallet.accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .audit {
        width: 100%;
        display: block;
        padding-top: 15px;
        overflow-y: auto;
        text-align: center;
    }

    .audit > :global(*) {
        margin-bottom: 10px;
    }

    .title {
        margin: 10px 30px;
    }

    span {
        display: block;
        text-align: center;
    }

    .container {
        background-color: var(--wallet-background);
        box-sizing: border-box;
        overflow-y: scroll;
        display: flex;
        flex-wrap: wrap;
        flex-direction: row;
        justify-content: space-around;
        overflow: hidden;
        height: auto;
    }

    @-webkit-keyframes rotating {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(-360deg);
        }
    }
    .audit :global(.audit-loading .icon_base) {
        -webkit-animation: rotating 2s linear infinite;
    }
</style>
