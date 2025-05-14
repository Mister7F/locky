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

    let [urlLeft, urlHost, urlPath] = $derived.by(() => {
        if (type !== 'url' || !isUrlValid(value)) {
            return [null, null, null]
        }

        let url = null
        try {
            url = new URL(value)
        } catch {
            return [null, null, null]
        }

        let leftPart = url.protocol + '//'
        if (url.username) {
            leftPart += url.username
            if (url.password) {
                leftPart += ':' + url.password
            }
            leftPart += '@'
        }

        return [
            leftPart,
            url.host,
            value.slice(leftPart.length + url.host.length),
        ]
    })

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
    <div class="field {className} {readonly && 'readonly'}">
        {#if readonly}
            <div class="label-readonly">{label}</div>
        {/if}

        <div class="content">
            {#if readonly}
                {#if type === 'url' && isUrlValid(value) && urlLeft && urlHost}
                    <a class="value" href={value} title={value} target="_blank">
                        <span>{urlLeft}</span><span class="host">{urlHost}</span
                        ><span>{urlPath}</span>
                    </a>
                {:else if type === 'password'}
                    {#if !passwordVisible}
                        <div class="value">{'•••••••••'}</div>
                    {:else}
                        <div class="multi-line-value">{value}</div>
                    {/if}
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
        max-height: 100%;
        width: auto;
        text-align: left;
        max-width: 350px;
        padding: 18px 0;
    }
    .field.readonly {
        /* need less space because no help (TOTP / password) */
        padding: 5px 0;
    }

    .content {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        min-height: 50px;
        box-sizing: border-box;
    }

    .label-readonly {
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
        padding: 12px 0;
    }

    .multi-line-value {
        width: 100%;
        color: var(--on-primary);
        padding: 12px 0;
        word-break: break-all;
    }

    a {
        text-decoration: none;
    }
    a span:not(.host) {
        color: var(--on-primary) !important;
    }
    a span.host {
        color: var(--link-color) !important;
    }
    a:hover span {
        text-decoration: underline;
    }
</style>
