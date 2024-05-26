<script>
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'

    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    export let account
    let removeAccountDialogOpen = false

    export function open() {
        removeAccountDialogOpen = true
    }
</script>

<Dialog
    bind:open={removeAccountDialogOpen}
    class="account_editor_dialog remove_account_dialog"
    title="Delete this account"
>
    Are you sure you want to remove the {account.name} account ?

    <div slot="actions">
        <Button
            style="margin-top: 10px; margin-right: 10px;"
            color="secondary"
            variant="outlined"
            on:click={() => (removeAccountDialogOpen = false)}
        >
            No
        </Button>
        <Button
            style="margin-top: 10px;"
            color="secondary"
            on:click={() => dispatch('remove')}
        >
            Yes
        </Button>
    </div>
</Dialog>

<style>
    :global(.remove_account_dialog .mdc-dialog__surface) {
        border: 1px solid var(--error);
    }
</style>
