<script>
    import Button from '../../helpers/Button.svelte'
    import IconButton from '../../helpers/IconButton.svelte'
    import Fab from '../../helpers/Fab.svelte'

    import Field from '../../helpers/field/Field.svelte'
    import { copyValue } from '../../helpers/utils.js'
    import { getTotpCode } from '../../helpers/crypto.js'
    import Icon from '../../helpers/Icon.svelte'
    import ImagePicker from './ImagePicker.svelte'
    import DialogTotpQrCode from './DialogTotpQrCode.svelte'
    import DialogRemoveAccount from './DialogRemoveAccount.svelte'
    import GeneratePassword from './GeneratePassword.svelte'

    let { onsave, onclose, onremove, account, readonly = 0 } = $props()

    let qrCodeDialog = $state()
    let removeAccountDialog = $state()
    let generatePasswordDialog = $state()

    // TOTP
    let totpCode = $state(null)
    let time = $state(30)
    let totpTimeoutHandle = null

    let totpMessage = $derived(makeTotpMessage(totpCode, time))

    $effect(updateTotp)

    let iconSrcs = $state([])

    function makeTotpMessage(totp, time) {
        if (!totp) {
            return ''
        }
        const strTotp = '' + totp
        return `${totp.slice(0, 3)} ${totp.slice(3)} (${time})`
    }

    async function updateTotp() {
        // Cancel previous call
        clearTimeout(totpTimeoutHandle)
        if (!account) {
            return
        }
        if (account.totp && account.totp.length) {
            totpCode = await getTotpCode(account.totp)
        }
        const timestamp = Math.floor(Date.now() / 1000)
        time = 30 - (timestamp % 30)
        totpTimeoutHandle = setTimeout(updateTotp, 1000)
    }

    function removeField(fieldIndex) {
        account.fields.splice(fieldIndex, 1)
        account.fields = account.fields
    }

    function onEdit(accountEdited) {
        readonly = false
        totpCode = null
    }

    function onSave() {
        onsave(account)
        readonly = true
        totpCode = null
    }

    function onNewField() {
        if (!account.fields) {
            account.fields = []
        }
        account.fields = account.fields.concat({
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
            (!account.icon || account.icon === 'img/accounts/default.svg') &&
            iconSrcs &&
            account.icon.length > 4
        ) {
            const accountName = account.name
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
                account.icon = findIcon
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
            bind:src={account.icon}
            {readonly}
            size="100px"
            bind:srcs={iconSrcs}
        />

        <Field
            label="Name"
            bind:value={account.name}
            {readonly}
            copy="0"
            onblur={onFindImage}
        />
        <Field
            label="Login"
            bind:value={account.login}
            {readonly}
            oncopy={() => copyValue(account.login)}
        />
        <Field
            label="Password"
            bind:value={account.password}
            {readonly}
            type="password"
            showPasswordStrength="1"
            oncopy={() => copyValue(account.password)}
            showGeneratePassword="1"
        />
        <Field
            label="URL"
            bind:value={account.url}
            {readonly}
            type="url"
            oncopy={() => copyValue(account.url)}
        />
        <Field
            label="2FA"
            bind:value={account.totp}
            {readonly}
            type="totp"
            message={totpMessage}
            messagePersistent="1"
            onshow_qrcode={() => qrCodeDialog.open()}
            onchange={updateTotp}
            oncopy={async () => copyValue(getTotpCode(account.totp))}
        />

        {#each account.fields || [] as field, i}
            <Field
                bind:label={field.name}
                bind:value={field.value}
                {readonly}
                bind:type={field.type}
                index={i}
                canEditType="1"
                onremove={() => removeField(i)}
                oncopy={() => copyValue(field.value)}
                showGeneratePassword="1"
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
            onclick={() => removeAccountDialog.open()}
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

<DialogTotpQrCode {account} bind:this={qrCodeDialog} />

<DialogRemoveAccount bind:this={removeAccountDialog} {account} {onremove} />

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
