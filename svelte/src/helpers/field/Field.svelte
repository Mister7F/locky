<script>
    import FieldAction from './FieldAction.svelte'
    import IconButton from '../IconButton.svelte'
    import TextInput from '../TextInput.svelte'
    import PasswordWarning from './PasswordWarning.svelte'
    import { passwordStrength } from '../crypto.js'
    import { isUrlValid } from '../utils.js'
    import Icon from '../Icon.svelte'
    import GeneratePassword from '../../application/editor/GeneratePassword.svelte'

    let {
        label = $bindable(''),
        readonly = 0,
        type = $bindable('text'),
        showPasswordStrength = false,
        value = $bindable(),
        message = null,
        messagePersistent = false,
        copy = 1,
        class: className = '',
        canEditType = false,
        index = 0,
        passwordVisible = false,
        showGeneratePassword = false,
        onchange = null,
        oninput = null,
        onkeydown = null,
        onblur = null,
        onenter = null,
        oncopy = null,
        onshow_qrcode = null,
        onremove = null,
    } = $props()

    let copied = $state(false)
    let generatePasswordDialog = $state(null)

    let computedType = $derived(
        passwordVisible || type !== 'password' ? 'text' : 'password'
    )

    let [strength, strengthResult] = $derived(
        type === 'password' && showPasswordStrength && value && value.length
            ? passwordStrength(value, true)
            : [null, null]
    )

    const getMessage = (message, strength) => {
        if (message && message.length) {
            return message
        } else if (strength !== null) {
            return 'Strength: ' + (strength || 0) + ' / 100'
        }
    }
    let computedMessage = $derived(getMessage(message, strength))

    /**
     * Generate the event "enter" when pressing enter.
     */
    function onKeyPress(e) {
        if (!e) e = window.event
        if ((e.keyCode || e.which) == 13) {
            e.preventDefault()
            e.stopPropagation()
            onenter()
            return false
        }
    }

    function onCopyClick() {
        oncopy()
        copied = true
        setTimeout(() => (copied = false), 1000)
    }
</script>

{#if value || !readonly}
    <div class="field {className}">
        {#if readonly}
            <div class="label">{label}</div>
        {/if}

        <div class="content">
            {#if readonly}
                {#if type === 'url' && isUrlValid(value)}
                    <a class="value" href={value} target="_blank">{value}</a>
                {:else if type === 'password' && !passwordVisible}
                    <div class="value">{'•••••••••'}</div>
                {:else if type === 'totp'}
                    <div class="value">{message}</div>
                {:else}
                    <div class="value">{value}</div>
                {/if}
            {:else}
                <TextInput
                    class="text-field"
                    {label}
                    bind:value
                    type={computedType}
                    onkeypress={onKeyPress}
                    {onchange}
                    {oninput}
                    {onkeydown}
                    {onblur}
                    help={computedMessage}
                    helpPersistent={messagePersistent}
                />
            {/if}
            {#if type === 'password'}
                <IconButton
                    onclick={() => (passwordVisible = !passwordVisible)}
                    icon={passwordVisible ? 'visibility' : 'visibility_off'}
                />
                {#if showGeneratePassword && !value?.length}
                    <GeneratePassword
                        bind:this={generatePasswordDialog}
                        onuse={(password) => (value = password)}
                    />
                    <IconButton
                        onclick={() => generatePasswordDialog.open()}
                        icon="refresh"
                    />
                {:else if strengthResult && strengthResult.feedback}
                    <PasswordWarning {strengthResult} />
                {/if}
            {:else if type === 'totp' && value}
                <IconButton onclick={onshow_qrcode} icon="qr_code" />
            {/if}
            {#if canEditType && !readonly}
                <FieldAction bind:type bind:label {onremove} />
            {/if}
            {#if parseInt(copy) && value}
                <IconButton
                    onclick={onCopyClick}
                    icon={copied ? 'check' : 'content_copy'}
                />
            {/if}
        </div>
    </div>
{/if}

<style>
    .field {
        height: 72px;
        max-height: 100%;
        width: auto;
        text-align: left;
        max-width: 350px;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        height: 50px;
        box-sizing: border-box;
    }

    .label {
        min-width: calc(100% - 50px);
        max-width: calc(100% - 50px);
        letter-spacing: 0.4px;
        font-size: 13px;
        margin-bottom: -6px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--on-primary);
    }

    .value {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--on-primary);
    }

    a {
        color: var(--link-color) !important;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
</style>
