<script>
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'

    let { onremove, account } = $props()

    let removeAccountDialogOpen = $state(false)

    export function open() {
        removeAccountDialogOpen = true
    }
</script>

<Dialog bind:open={removeAccountDialogOpen} title="Delete this account">
    Are you sure you want to remove the {account.name} account ?

    <div slot="actions">
        <Button
            style="margin-top: 10px; margin-right: 10px;"
            color="secondary"
            variant="outlined"
            onclick={() => (removeAccountDialogOpen = false)}
        >
            No
        </Button>
        <Button style="margin-top: 10px;" color="secondary" onclick={onremove}>
            Yes
        </Button>
    </div>
</Dialog>
