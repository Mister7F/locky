<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Fab from '../../helpers/Fab.svelte'
    import Account from '../../models/account.ts'
    import { Field as FieldType } from '../../models/account.ts'

    import Field from '../../helpers/field/Field.svelte'
    import { copyValue } from '../../helpers/utils.ts'
    import { getTotpCode } from '../../helpers/crypto.ts'
    import Icon from '../../helpers/Icon.svelte'
    import ImagePicker from './ImagePicker.svelte'
    import DialogTotpQrCode from './DialogTotpQrCode.svelte'
    import DialogRemoveAccount from './DialogRemoveAccount.svelte'
    import GeneratePassword from './GeneratePassword.svelte'

    interface Props {
        account: Account
        readonly?: boolean
        onclose: () => void
        onremove: () => void
        onsave: (account: Account) => void
    }

    let {
        onsave,
        onclose,
        onremove,
        account,
        readonly = false,
    }: Props = $props()

    // Svelte does not track class reactivity
    let accountDraft = $state(JSON.parse(JSON.stringify(account)))
    $effect(() => {
        accountDraft = JSON.parse(JSON.stringify(account))
    })

    let qrCodeDialog = $state<DialogTotpQrCode | undefined>()
    let removeAccountDialog = $state<DialogRemoveAccount | undefined>()
    let generatePasswordDialog = $state<GeneratePassword | undefined>()

    // TOTP
    let totpCode = $state(null)
    let time = $state(30)
    let totpTimeoutHandle: number | undefined

    let totpMessage = $derived(makeTotpMessage(totpCode, time))

    $effect(() => {
        void updateTotp()
    })

    let iconSrcs = $state([])

    function makeTotpMessage(totp: string | null, time: number): string {
        if (!totp) {
            return ''
        }
        const strTotp = '' + totp
        return `${totp.slice(0, 3)} ${totp.slice(3)} (${time})`
    }

    async function updateTotp() {
        // Cancel previous call
        if (totpTimeoutHandle) {
            clearTimeout(totpTimeoutHandle)
        }
        if (!account) {
            return
        }
        if (accountDraft.totp && accountDraft.totp.length) {
            totpCode = await getTotpCode(accountDraft.totp)
        }
        const timestamp = Math.floor(Date.now() / 1000)
        time = 30 - (timestamp % 30)
        totpTimeoutHandle = setTimeout(updateTotp, 1000)
    }

    function removeField(fieldIndex) {
        accountDraft.fields.splice(fieldIndex, 1)
        accountDraft.fields = accountDraft.fields
    }

    function onEdit(accountEdited?: Account) {
        readonly = false
        totpCode = null
    }

    function onSave() {
        onsave(Account.fromJson(accountDraft))
        readonly = true
        totpCode = null
    }

    function onNewField() {
        if (!accountDraft.fields) {
            accountDraft.fields = []
        }
        accountDraft.fields = accountDraft.fields.concat({
            name: 'Field',
            type: 'text',
            value: '',
        })
        setTimeout(() =>
            document.querySelector('.account .fields').scrollBy(0, 10000)
        )
    }

    function onFindImage() {
        if (
            (!accountDraft.icon ||
                accountDraft.icon === 'img/accounts/default.svg') &&
            iconSrcs &&
            (accountDraft.icon?.length || 0) > 4
        ) {
            const accountName = (accountDraft.name || '')
                .toLowerCase()
                .replace(/[_\s-]/g, '')
            const findIcon = iconSrcs.find(
                (url) =>
                    url
                        .replace(/\.[^/.]+$/, '') // Remove file extension
                        .replace(/[_\s-]/g, '')
                        .indexOf(accountName) >= 0
            )
            if (findIcon) {
                accountDraft.icon = findIcon
            }
        }
    }
</script>

<div class="account">
    <IconButton
        class="account_editor_close_button"
        color="on-primary"
        icon="close"
        onclick={onclose}
    />
    <div class="fields">
        <ImagePicker
            bind:src={accountDraft.icon}
            {readonly}
            size="100px"
            bind:srcs={iconSrcs}
            transitionName="image_{accountDraft.id}"
        />

        <Field
            label="Name"
            bind:value={accountDraft.name}
            {readonly}
            copy={false}
            onblur={onFindImage}
        />
        <Field
            label="Login"
            bind:value={accountDraft.login}
            {readonly}
            oncopy={() => copyValue(accountDraft.login)}
        />
        <Field
            label="Password"
            bind:value={accountDraft.password}
            {readonly}
            type="password"
            showPasswordStrength={true}
            oncopy={() => copyValue(accountDraft.password)}
            showGeneratePassword={true}
        />
        <Field
            label="URL"
            bind:value={accountDraft.url}
            {readonly}
            type="url"
            oncopy={() => copyValue(accountDraft.url)}
        />
        <Field
            label="2FA"
            bind:value={accountDraft.totp}
            {readonly}
            type="totp"
            message={totpMessage}
            messagePersistent={true}
            onshow_qrcode={() => qrCodeDialog?.open()}
            onchange={updateTotp}
            oncopy={async () => copyValue(getTotpCode(accountDraft.totp))}
        />

        {#each accountDraft.fields as field, i}
            <Field
                bind:label={field.name}
                bind:value={field.value}
                {readonly}
                bind:type={field.type}
                index={i}
                canEditType={true}
                onremove={() => removeField(i)}
                oncopy={() => copyValue(field.value)}
                showGeneratePassword={true}
            />
        {/each}

        {#if !readonly}
            <Button onclick={onNewField} color="secondary" variant="text"
                >New field</Button
            >
        {/if}
    </div>

    {#if !readonly}
        <Fab
            class="remove_account"
            color="on-primary"
            onclick={() => removeAccountDialog?.open()}
            icon="delete"
        />
    {/if}
    <Fab
        class="save_account"
        color="on-secondary"
        icon={readonly ? 'create' : 'done'}
        onclick={() => (readonly ? onEdit() : onSave())}
    />
</div>

<DialogTotpQrCode
    account={Account.fromJson(accountDraft)}
    bind:this={qrCodeDialog}
/>

<DialogRemoveAccount bind:this={removeAccountDialog} {onremove} />

<style>
    .account {
        padding: 20px;
        padding-bottom: 90px;
        color: var(--on-primary);
        background-color: var(--primary);
        margin: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        overflow-y: auto;
        box-sizing: border-box;
        scrollbar-color: light;
        scrollbar-width: 2px;
        --scrollbar-color: var(--on-primary);
    }

    .fields {
        width: 90%;
        height: 100%;
        max-height: 100%;
        overflow-y: auto;
        text-align: center;
    }

    .account :global(.save_account) {
        position: absolute;
        bottom: 20px;
        right: 20px;
    }
    .account :global(.generate_password),
    .account :global(.remove_account) {
        position: absolute;
        bottom: 20px;
        left: 20px;
    }
    .account :global(.remove_account span) {
        color: var(--error) !important;
    }

    :global(.account_editor_close_button) {
        z-index: 99;
        position: absolute;
        right: 16px;
    }
</style>
