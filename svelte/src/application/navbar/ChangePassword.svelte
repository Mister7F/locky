<script>
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import * as api from '../api.js'
    import Field from '../../helpers/field/Field.svelte'

    let oldPassword = ''
    let newPassword = ''
    let confirmPassword = ''
    let dialogOpen
    let error = false
    $: canSubmit = newPassword && newPassword === confirmPassword

    async function changePassword() {
        if (await api.updatePassword(oldPassword, newPassword)) {
            dialogOpen = false
        } else {
            error = true
        }
    }

    export function open() {
        error = false
        oldPassword = ''
        newPassword = ''
        confirmPassword = ''
        dialogOpen = true
    }
</script>

<Dialog bind:open={dialogOpen} title="New password">
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
</Dialog>

<style>
    .error {
        text-align: center;
        color: var(--error-color);
        margin-top: 10px;
    }

    .action {
        text-align: center;
    }
</style>
