<!--
    Make some HTTP request to haveibeenpwned to know if one of the passwords has been leaked.
    Only a part of the hash is sent so it will not leak the account passwords.

    See https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
 -->
<script lang="ts">
    import Button from '../helpers/Button.svelte'
    import AccountCard from './AccountCard.svelte'
    import Icon from '../helpers/Icon.svelte'
    import zxcvbn from 'zxcvbn'
    import { digest, passwordStrength } from '../helpers/crypto.ts'
    import Account from '../models/account.ts'
    import Wallet from '../models/wallet.ts'
    import { getAliasDomains, getAliases } from './simplelogin/simplelogin.ts'

    const url = 'https://api.pwnedpasswords.com/range/'
    const simpleLoginAliasTrashUrl =
        'https://app.simplelogin.io/dashboard/alias_trash'

    interface Props {
        wallet: Wallet
        onedit: (account: Account) => void
    }

    type SimpleLoginAudit = {
        missingAccounts: Account[]
        orphanedAliases: string[]
        sharedAliasAccounts: Account[]
    }

    let { wallet, onedit }: Props = $props()

    let accounts = $derived(
        wallet.accounts.filter((account) => !account.in_trash)
    )
    let loading = $state(false)
    let leakedAccountsIndex = $state([])
    let weakAccountsIndex = $state([])
    let duplicatedIndex = $state([])
    let missingSimpleLoginAccounts: Account[] = $state([])
    let orphanedSimpleLoginAliases: string[] = $state([])
    let sharedSimpleLoginAccounts: Account[] = $state([])
    let simpleLoginAuditError = $state('')

    function getEmail(value?: string): string | undefined {
        const email = value?.trim().toLowerCase()
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ? email
            : undefined
    }

    function getAccountEmails(account: Account): string[] {
        return [
            getEmail(account.login),
            ...account.fields
                .filter((field) => field.type === 'email')
                .map((field) => getEmail(field.value)),
        ].filter((email): email is string => !!email)
    }

    async function auditSimpleLogin(): Promise<SimpleLoginAudit> {
        const apiKey = wallet.settings.simpleLoginApiKey
        if (!apiKey) {
            return {
                missingAccounts: [],
                orphanedAliases: [],
                sharedAliasAccounts: [],
            }
        }

        const [aliases, aliasDomains] = await Promise.all([
            getAliases(apiKey),
            getAliasDomains(apiKey),
        ])
        const aliasEmails = new Set(
            aliases.map((alias) => alias.email.trim().toLowerCase())
        )
        const domains = new Set(aliasDomains)
        for (const email of aliasEmails) {
            domains.add(email.split('@').pop())
        }

        const missingAccounts = wallet.accounts.filter((account) =>
            getAccountEmails(account).some((email) => {
                const domain = email.split('@').pop()
                return domains.has(domain) && !aliasEmails.has(email)
            })
        )

        const accountsByEmail = new Map<string, Account[]>()
        for (const account of accounts) {
            for (const email of new Set(getAccountEmails(account))) {
                const emailAccounts = accountsByEmail.get(email) || []
                emailAccounts.push(account)
                accountsByEmail.set(email, emailAccounts)
            }
        }

        const walletEmails = new Set(
            wallet.accounts.flatMap((account) => getAccountEmails(account))
        )
        const orphanedAliases = aliases
            .map((alias) => alias.email.trim().toLowerCase())
            .filter((email) => !walletEmails.has(email))
        const sharedAliasAccounts = [
            ...new Set(
                [...accountsByEmail.entries()]
                    .filter(([email, emailAccounts]) => {
                        const domain = email.split('@').pop()
                        return domains.has(domain) && emailAccounts.length > 1
                    })
                    .flatMap(([, emailAccounts]) => emailAccounts)
            ),
        ]

        return { missingAccounts, orphanedAliases, sharedAliasAccounts }
    }

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
        missingSimpleLoginAccounts = []
        orphanedSimpleLoginAliases = []
        sharedSimpleLoginAccounts = []
        simpleLoginAuditError = ''

        const simpleLoginAudit = auditSimpleLogin()
            .then((result) => ({ ...result, error: '' }))
            .catch((error) => ({
                missingAccounts: [],
                orphanedAliases: [],
                sharedAliasAccounts: [],
                error:
                    error instanceof Error
                        ? error.message
                        : 'Could not audit SimpleLogin aliases',
            }))

        const passwords = accounts
            .map((account) => account.password)
            .filter((password) => password && password.length)
            .filter((v, i, a) => a.indexOf(v) === i) // keep only unique values

        const leakedPassword = []
        for (const password of passwords) {
            if (await isPasswordLeaked(password)) {
                leakedPassword.push(password)
            }
        }

        for (let i = 0; i < accounts.length; i++) {
            if (leakedPassword.includes(accounts[i].password)) {
                leakedAccountsIndex.push(i)
            }

            if (
                accounts[i].password?.length &&
                passwordStrength(accounts[i].password).strength < 90
            ) {
                weakAccountsIndex.push(i)
            }
        }

        // Find passwords reused in either the main password or custom fields.
        const passwordAccounts = new Map<string, number[]>()
        const _duplicatedIndex = new Set()
        for (let i = 0; i < accounts.length; i++) {
            const accountPasswords = [
                accounts[i].password,
                ...accounts[i].fields
                    .filter((field) => field.type === 'password')
                    .map((field) => field.value),
            ].filter((password): password is string => !!password?.length)

            for (const password of accountPasswords) {
                const passwordAccountIndexes =
                    passwordAccounts.get(password) || []
                passwordAccountIndexes.push(i)
                passwordAccounts.set(password, passwordAccountIndexes)
            }
        }
        for (const accountIndexes of passwordAccounts.values()) {
            if (accountIndexes.length > 1) {
                accountIndexes.forEach((index) => _duplicatedIndex.add(index))
            }
        }

        leakedAccountsIndex = leakedAccountsIndex
        weakAccountsIndex = weakAccountsIndex
        duplicatedIndex = [..._duplicatedIndex]

        const simpleLoginResult = await simpleLoginAudit
        missingSimpleLoginAccounts = simpleLoginResult.missingAccounts
        orphanedSimpleLoginAliases = simpleLoginResult.orphanedAliases
        sharedSimpleLoginAccounts = simpleLoginResult.sharedAliasAccounts
        simpleLoginAuditError = simpleLoginResult.error

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

    {#if missingSimpleLoginAccounts.length}
        <h2>Missing SimpleLogin aliases</h2>
        <span class="title">
            The SimpleLogin aliases of those accounts no longer exist.
            <a
                class="danger"
                href={simpleLoginAliasTrashUrl}
                target="_blank"
                rel="noopener noreferrer"
                >Restore them to avoid losing access!</a
            >
        </span>
        <div class="container">
            {#each missingSimpleLoginAccounts as account}
                <div class="audit-account">
                    {#if account.in_trash}
                        <span class="trash-banner">Trash</span>
                    {/if}
                    <AccountCard
                        {account}
                        onclick={() => onedit(account)}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if sharedSimpleLoginAccounts.length}
        <h2>Shared SimpleLogin aliases</h2>
        <span class="title">
            These SimpleLogin aliases are
            <strong class="danger">shared</strong> by multiple accounts.
        </span>
        <div class="container">
            {#each sharedSimpleLoginAccounts as account}
                <div>
                    <AccountCard
                        {account}
                        onclick={() => onedit(account)}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if orphanedSimpleLoginAliases.length}
        <h2>Orphaned SimpleLogin aliases</h2>
        <span class="title">
            These SimpleLogin aliases are not used by any account in this
            wallet.
        </span>
        <div class="alias-list">
            {#each orphanedSimpleLoginAliases as alias}
                <span>{alias}</span>
            {/each}
        </div>
    {/if}

    {#if leakedAccountsIndex.length}
        <h2>Leaked passwords</h2>
        <span class="title">
            The passwords of those accounts have been
            <a
                class="danger"
                href="https://haveibeenpwned.com/Passwords"
                target="_blank"
                rel="noopener noreferrer">leaked</a
            >, you must change them!
        </span>
        <div class="container">
            {#each leakedAccountsIndex as accountIndex, index}
                <div>
                    <AccountCard
                        account={accounts[accountIndex]}
                        onclick={() => onedit(accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if weakAccountsIndex.length}
        <h2>Weak passwords</h2>
        <span class="title">
            The passwords of those accounts are
            <a
                class="danger"
                href="https://github.com/dropbox/zxcvbn"
                target="_blank"
                rel="noopener noreferrer">weak</a
            >
            and must be changed!
        </span>
        <div class="container">
            {#each weakAccountsIndex as accountIndex, index}
                <div>
                    <AccountCard
                        account={accounts[accountIndex]}
                        onclick={() => onedit(accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if duplicatedIndex.length}
        <h2>Reused passwords</h2>
        <span class="title">
            The passwords of those accounts are
            <strong class="danger">re-used</strong> and must be changed!
        </span>
        <div class="container">
            {#each duplicatedIndex as accountIndex, index}
                <div>
                    <AccountCard
                        account={accounts[accountIndex]}
                        onclick={() => onedit(accounts[accountIndex])}
                        viewMode="minimalist"
                    />
                </div>
            {/each}
        </div>
    {/if}

    {#if simpleLoginAuditError}
        <span class="simplelogin-error">
            SimpleLogin audit failed: {simpleLoginAuditError}
        </span>
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
        text-align: left;
    }

    h2 {
        margin: 20px 30px 0;
        font-size: 1.2rem;
        text-align: left;
    }

    span {
        display: block;
        text-align: center;
    }

    .simplelogin-error {
        margin: 10px 30px;
        color: var(--error);
    }

    .danger {
        color: var(--error);
        font-weight: bold;
    }

    .audit-account {
        position: relative;
    }

    .trash-banner {
        position: absolute;
        z-index: 1;
        top: 10px;
        right: 5px;
        padding: 2px 6px;
        border-radius: 0 4px 0 4px;
        color: var(--on-primary);
        background-color: var(--error);
        font-size: 0.65rem;
        font-weight: bold;
        line-height: 1rem;
        pointer-events: none;
        text-transform: uppercase;
    }

    .alias-list {
        margin: 0 30px;
        overflow: hidden;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        background-color: transparent;
    }

    .alias-list span {
        overflow: hidden;
        padding: 8px;
        border-bottom: 1px solid
            color-mix(in srgb, var(--on-primary) 12%, transparent);
        color: inherit;
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .alias-list span:last-child {
        border-bottom: 0;
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

    @keyframes rotating {
        from {
            -webkit-transform: rotate(0deg);
        }
        to {
            -webkit-transform: rotate(-360deg);
        }
    }
    .audit :global(.audit-loading .icon_base) {
        animation: rotating 2s linear infinite;
    }
</style>
