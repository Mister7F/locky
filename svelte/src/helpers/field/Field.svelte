<script>
    import Textfield from '@smui/textfield'

    import { createEventDispatcher } from 'svelte'
    import FieldAction from './FieldAction.svelte'
    import IconButton from '../IconButton.svelte'
    import PasswordWarning from './PasswordWarning.svelte'
    import { passwordStrength } from '../crypto.js'
    import { isUrlValid } from '../utils.js'
    import Icon from '../Icon.svelte'

    const dispatch = createEventDispatcher()
    export let label = ''
    export let readonly = 0
    export let type = 'text'
    export let showPasswordStrength = false
    export let value = ''
    export let message = null
    export let messagePersistent = false
    export let copy = 1
    let className = ''
    export { className as class }
    export let canEditType = false
    export let index = 0
    export let passwordVisible = false

    let textField
    let copied = false

    $: computedType = passwordVisible ? 'text' : type

    $: [strength, strengthResult] =
        type === 'password' && showPasswordStrength && value && value.length
            ? passwordStrength(value, true)
            : [null, null]

    const getMessage = (message, strength) => {
        if (message && message.length) {
            return message
        } else if (strength !== null) {
            return 'Strength: ' + (strength || 0) + ' / 100'
        }
    }
    $: computedMessage = getMessage(message, strength)

    /**
     * Generate the event "enter" when pressing enter.
     */
    function onKeyPress(e) {
        if (!e) e = window.event
        if ((e.keyCode || e.which) == 13) {
            e.preventDefault()
            e.stopPropagation()
            dispatch('enter')
            return false
        }
    }

    /**
     * Allow to give the focus on this element.
     */
    export function focus() {
        if (textField) textField.focus()
    }

    function onCopyClick() {
        dispatch('copy')
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
                <form class="text-field-container">
                    <Textfield
                        class="text-field"
                        bind:label
                        bind:value
                        bind:this={textField}
                        bind:type={computedType}
                        on:keypress={onKeyPress}
                        on:change
                        on:input
                        on:keydown
                        on:blur
                        input$aria-controls="helper-text-standard-field"
                        input$autocomplete="off"
                    />
                    {#if computedMessage}
                        <span persistent={messagePersistent}>
                            {computedMessage}
                        </span>
                    {/if}
                </form>
            {/if}

            {#if type === 'password'}
                <IconButton
                    on:click={() => (passwordVisible = !passwordVisible)}
                    icon={passwordVisible ? 'visibility' : 'visibility_off'}
                />
                {#if strengthResult && strengthResult.feedback}
                    <PasswordWarning bind:strengthResult />
                {/if}
            {:else if type === 'totp' && value}
                <IconButton
                    on:click={() => dispatch('show_qrcode')}
                    icon="qr_code"
                />
            {/if}
            {#if canEditType && !readonly}
                <FieldAction
                    bind:type
                    bind:label
                    on:remove={() => dispatch('remove', index)}
                />
            {/if}
            {#if parseInt(copy) && value}
                <IconButton
                    on:click={onCopyClick}
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

    .text-field-container {
        width: 100%;
    }

    .text-field-container :global(.text-field) {
        width: 100%;
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
    }

    .value {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .message {
        font-size: 12px;
        letter-spacing: 0.4px;
    }

    a {
        color: var(--link-color);
    }

    a:hover {
        text-decoration: underline;
    }

    /* Set colors */
    .field {
        color: var(--on-primary);
    }
    .field .label {
        color: var(--on-primary);
        filter: brightness(85%);
    }
</style>
