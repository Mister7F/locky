<!--
    Make some HTTP request to haveibeenpwned to know if one of the passwords has been leaked.
    Only a part of the hash is sent so it will not leak the account passwords.

    See https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 -->
<script>
    import Button from '../helpers/Button.svelte'
    import AccountCard from './AccountCard.svelte'
    import { createEventDispatcher } from 'svelte'
    import Icon from '../helpers/Icon.svelte'

    import { digest, passwordStrength } from '../helpers/crypto.js'

    const dispatch = createEventDispatcher()

    const url = 'https://api.pwnedpasswords.com/range/'

    export let wallet

    let loading = false
    let leakedAccountsIndex = []
    let weakAccountsIndex = []

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

        const passwords = wallet['accounts']
            .map((account) => account.password)
            .filter((password) => password && password.length)
            .filter((v, i, a) => a.indexOf(v) === i) // keep only unique values

        const leakedPassword = []
        for (const password of passwords) {
            if (await isPasswordLeaked(password)) {
                leakedPassword.push(password)
            }
        }

        for (let i = 0; i < wallet['accounts'].length; i++) {
            if (leakedPassword.includes(wallet['accounts'][i].password)) {
                leakedAccountsIndex.push(i)
            }

            if (
                passwordStrength(wallet['accounts'][i].password) < 90 &&
                wallet['accounts'][i].password.length
            ) {
                weakAccountsIndex.push(i)
            }
        }

        leakedAccountsIndex = leakedAccountsIndex
        weakAccountsIndex = weakAccountsIndex

        loading = false
    }
</script>

<div class="audit">
    <Button
        class="audit-loading"
        color="secondary"
        on:click={onStartAudit}
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
                        account={wallet['accounts'][accountIndex]}
                        on:click={() =>
                            dispatch('edit', wallet['accounts'][accountIndex])}
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
    {/if}
    <div class="container">
        {#each weakAccountsIndex as accountIndex, index}
            <div {index}>
                <AccountCard
                    account={wallet['accounts'][accountIndex]}
                    on:click={() =>
                        dispatch('edit', wallet['accounts'][accountIndex])}
                    viewMode="minimalist"
                />
            </div>
        {/each}
    </div>
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
