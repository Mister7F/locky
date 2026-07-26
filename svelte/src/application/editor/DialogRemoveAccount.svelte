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

<Dialog
    bind:open={removeAccountDialogOpen}
    title="Delete this account permanently"
>
    This account will be permanently deleted. This action cannot be undone.

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (removeAccountDialogOpen = false)}
        >
            No
        </Button>
        <Button color="danger" onclick={onremove}>Delete</Button>
    {/snippet}
</Dialog>
