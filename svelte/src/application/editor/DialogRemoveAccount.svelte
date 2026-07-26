<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Account from '../../models/account.ts'

    interface Props {
        onremove: () => void
    }

    let { onremove }: Props = $props()

    let removeAccountDialogOpen = $state(false)

    export function open() {
        removeAccountDialogOpen = true
    }
</script>

<Dialog bind:open={removeAccountDialogOpen} title="Delete this account">
    Are you sure you want to remove the account ?

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (removeAccountDialogOpen = false)}
        >
            No
        </Button>
        <Button color="danger" onclick={onremove}>Yes</Button>
    {/snippet}
</Dialog>
