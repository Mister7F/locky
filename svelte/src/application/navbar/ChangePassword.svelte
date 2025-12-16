<script lang="ts">
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'
    import * as api from '../api.ts'
    import Field from '../../helpers/field/Field.svelte'

    let oldPassword = $state('')
    let newPassword = $state('')
    let confirmPassword = $state('')
    let dialogOpen = $state(false)
    let error = $state(false)

    let canSubmit = $derived(newPassword && newPassword === confirmPassword)

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
        copy={false}
    />
    <Field
        label="New password"
        type="password"
        bind:value={newPassword}
        copy={false}
        showPasswordStrength={true}
    />
    <Field
        label="Confirm"
        type="password"
        bind:value={confirmPassword}
        copy={false}
        showPasswordStrength={true}
    />
    <div class="action">
        <Button
            color="secondary"
            variant="outlined"
            onclick={changePassword}
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
