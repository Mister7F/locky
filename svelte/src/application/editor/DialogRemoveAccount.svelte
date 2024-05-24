<script>
    import Button from '@smui/button'
    import Dialog, { Title, Content, Actions } from '@smui/dialog'
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    export let account
    let removeAccountDialog

    export function open() {
        removeAccountDialog.open()
    }
</script>

<Dialog
    bind:this={removeAccountDialog}
    class="account_editor_dialog remove_account_dialog"
>
    <Content>
        <p>Are you sure you want to remove the {account.name} account ?</p>
        <Button
            style="margin-top: 10px; margin-right: 10px;"
            color="secondary"
            variant="outlined"
            on:click={() => removeAccountDialog.close()}
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
    </Content>
</Dialog>

<style>
    :global(.remove_account_dialog .mdc-dialog__surface) {
        border: 1px solid var(--error);
    }
</style>
