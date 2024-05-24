<script>
    import Button, { Icon } from '@smui/button'
    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import * as api from '../api.js'
    import Field from '../../helpers/field/Field.svelte'

    let oldPassword = ''
    let newPassword = ''
    let confirmPassword = ''
    let dialog
    let error = false
    $: canSubmit = newPassword && newPassword === confirmPassword

    async function changePassword() {
        if (await api.updatePassword(oldPassword, newPassword)) {
            dialog.close()
        } else {
            error = true
        }
    }

    export function open() {
        if (dialog) {
            error = false
            oldPassword = ''
            newPassword = ''
            confirmPassword = ''
            dialog.open()
        }
    }
</script>

<Dialog width="290" bind:this={dialog} class="change_password_dialog">
    <Title>New password</Title>
    <br />
    <Content>
        <Field
            label="Old password"
            type="password"
            bind:value={oldPassword}
            copy="0"
        />
        <Field
            label="New password"
            type="password"
            bind:value={newPassword}
            copy="0"
            showPasswordStrength="1"
        />
        <Field
            label="Confirm"
            type="password"
            bind:value={confirmPassword}
            copy="0"
            showPasswordStrength="1"
        />
        <div class="action">
            <Button
                color="secondary"
                variant="outlined"
                on:click={changePassword}
                disabled={!canSubmit}
            >
                Change
            </Button>
        </div>
        {#if error}
            <div class="error">Wrong password !</div>
        {/if}
    </Content>
</Dialog>

<style>
    .error {
        text-align: center;
        color: var(--error-color);
    }

    .action {
        text-align: center;
    }

    :global(.change_password_dialog .mdc-dialog__surface),
    :global(.change_password_dialog .mdc-dialog__title) {
        color: var(--on-primary);
        background-color: var(--primary);
    }
</style>
