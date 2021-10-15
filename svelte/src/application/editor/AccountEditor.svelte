<script>
    import Button from '@smui/button';
    import Fab, { Label } from '@smui/fab';
    import IconButton from '@smui/icon-button';
    import Textfield from '@smui/textfield';
    import { createEventDispatcher } from 'svelte';
    import Field from '../../helpers/field/Field.svelte';
    import { copyValue } from '../../helpers/utils.js';
    import { getTotpCode } from '../../helpers/crypto.js';
    import Icon from '../../helpers/Icon.svelte';
    import ImagePicker from './ImagePicker.svelte';
    import DialogTotpQrCode from './DialogTotpQrCode.svelte';
    import DialogRemoveAccount from './DialogRemoveAccount.svelte';
    import GeneratePassword from './GeneratePassword.svelte';

    export let account = null;
    export let readonly = 0;

    const dispatch = createEventDispatcher();
    let qrCodeDialog;
    let removeAccountDialog;
    let generatePasswordDialog;

    // TOTP
    let totpCode = null;
    let time = 30;
    let totpTimeoutHandle = null;
    $: totpMessage = makeTotpMessage(totpCode, time);
    $: {
        // Trick to start the TOTP loop when the account
        // is set or when the readonly state changed
        account, readonly;
        if (account) updateTotp();
    }

    let iconSrcs;

    function makeTotpMessage(totp, time) {
        if (!totp) {
            return '';
        }
        const strTotp = '' + totp;
        return `${totp.slice(0, 3)} ${totp.slice(3)} (${time})`;
    }

    async function updateTotp() {
        // Cancel previous call
        clearTimeout(totpTimeoutHandle);
        if (!account) {
            return;
        }
        if (account.totp && account.totp.length) {
            totpCode = await getTotpCode(account.totp);
        }
        const timestamp = Math.floor(Date.now() / 1000);
        time = 30 - (timestamp % 30);
        totpTimeoutHandle = setTimeout(updateTotp, 1000);
    }

    function removeField(fieldIndex) {
        account.fields.splice(fieldIndex, 1);
        account.fields = account.fields;
    }

    function onEdit(accountEdited) {
        readonly = false;
        totpCode = null;
    }

    function onSave() {
        dispatch('save', { account: account });
        readonly = true;
        totpCode = null;
    }

    function onNewField() {
        if (!account.fields) {
            account.fields = [];
        }
        account.fields = account.fields.concat({
            name: 'Field',
            type: 'text',
            value: '',
        });
        setTimeout(() => document.querySelector('.account .fields').scrollBy(0, 10000));
    }

    function onFindImage() {
        if (
            (!account.icon || account.icon === 'img/accounts/default.svg') &&
            iconSrcs &&
            account.icon.length > 4
        ) {
            const accountName = account.name.toLowerCase().replace(/[_\s-]/g, '');
            const findIcon = iconSrcs.find(
                (url) =>
                    url
                        .replace(/\.[^/.]+$/, '') // Remove file extension
                        .replace(/[_\s-]/g, '')
                        .indexOf(accountName) >= 0,
            );
            if (findIcon) {
                account.icon = findIcon;
            }
        }
    }

</script>

<div class="account">
    <IconButton
        class="account_editor_close_button"
        color="on-primary"
        on:click="{() => dispatch('close')}">
        <Icon>close</Icon>
    </IconButton>
    <div class="fields">
        <ImagePicker
            bind:src="{account.icon}"
            bind:readonly
            size="100px"
            bind:srcs="{iconSrcs}" />

        <Field
            label="Name"
            bind:value="{account.name}"
            bind:readonly
            on:copy="{() => copyValue(account.name)}"
            on:blur="{onFindImage}" />
        <Field
            label="Login"
            bind:value="{account.login}"
            bind:readonly
            on:copy="{() => copyValue(account.login)}" />
        <Field
            label="Password"
            bind:value="{account.password}"
            bind:readonly
            type="password"
            showPasswordStrength="1"
            on:copy="{() => copyValue(account.password)}" />
        <Field
            label="URL"
            bind:value="{account.url}"
            bind:readonly
            type="url"
            on:copy="{() => copyValue(account.url)}" />
        <Field
            label="2FA"
            bind:value="{account.totp}"
            bind:readonly
            type="totp"
            bind:message="{totpMessage}"
            messagePersistent="1"
            on:show_qrcode="{() => qrCodeDialog.open()}"
            on:change="{updateTotp}"
            on:copy="{async () => copyValue(await getTotpCode(account.totp))}" />

        {#each account.fields || [] as field, i}
            <Field
                bind:label="{field.name}"
                bind:value="{field.value}"
                bind:readonly
                bind:type="{field.type}"
                index="{i}"
                canEditType="1"
                on:remove="{() => removeField(i)}"
                on:copy="{() => copyValue(field.value)}" />
        {/each}

        {#if !readonly}
            <Button on:click="{onNewField}" color="secondary">New field</Button>
        {/if}
    </div>

    {#if readonly}
        <DialogRemoveAccount
            bind:this="{removeAccountDialog}"
            account="{account}"
            on:remove />
        <Fab
            class="remove_account"
            color="primary"
            on:click="{() => removeAccountDialog.open()}">
            <Icon color="secondary">delete</Icon>
        </Fab>
    {:else}
        <GeneratePassword
            bind:this="{generatePasswordDialog}"
            on:use="{(event) => (account.password = event.detail)}" />
        <Fab
            class="generate_password"
            color="primary"
            on:click="{() => generatePasswordDialog.open()}">
            <Icon color="secondary">password</Icon>
        </Fab>
    {/if}
    <Fab
        class="save_account"
        color="secondary"
        on:click="{() => (readonly ? onEdit() : onSave())}">
        <Icon color="on-secondary">{readonly ? 'create' : 'done'}</Icon>
    </Fab>
</div>

<DialogTotpQrCode bind:account bind:this="{qrCodeDialog}" />

<style>
    .account {
        padding: 20px;
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
    .account :global(.remove_account i) {
        color: var(--error) !important;
    }

    .field {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        height: 72px;
    }

    :global(.account_editor_close_button) {
        position: absolute;
        right: 25px;
    }

    :global(.account_editor_dialog .mdc-dialog__surface),
    :global(.account_editor_dialog p),
    :global(.account_editor_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }

</style>
