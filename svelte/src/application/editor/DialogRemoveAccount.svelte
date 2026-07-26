<script lang="ts">
    import Button from '../../helpers/Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Account from '../../models/account.ts'

    interface Props {
        onremove: () => void
        permanent?: boolean
    }

    let { onremove, permanent = false }: Props = $props()

    let removeAccountDialogOpen = $state(false)

    export function open() {
        removeAccountDialogOpen = true
    }
</script>

<Dialog
    bind:open={removeAccountDialogOpen}
    title={permanent ? 'Delete this account permanently' : 'Move to Trash'}
>
    {permanent
        ? 'This account will be permanently deleted. This action cannot be undone.'
        : 'Are you sure you want to move this account to Trash?'}

    {#snippet actions()}
        <Button
            color="secondary"
            variant="outlined"
            onclick={() => (removeAccountDialogOpen = false)}
        >
            No
        </Button>
        <Button color="danger" onclick={onremove}>
            {permanent ? 'Delete' : 'Move to Trash'}
        </Button>
    {/snippet}
</Dialog>
