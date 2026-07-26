<script lang="ts">
    import TextInput from '../../helpers/TextInput.svelte'
    import Icon from '../Icon.svelte'
    import IconButton from '../IconButton.svelte'
    import Button from '../Button.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import type { FieldType } from '../types.ts'

    interface Props {
        type?: FieldType
        label?: string
        onremove?: () => void
    }

    let {
        type = $bindable('text'),
        label = $bindable(''),
        onremove,
    }: Props = $props()

    let fieldNameDialogOpen = $state(false)
    let deleteConfirmation = $state(false)

    function onDelete() {
        onremove?.()
        deleteConfirmation = false
    }

    function onKeyPressFieldLabel(e: KeyboardEvent | Event) {
        if (!e) e = window.event
        const keyEvent = e as KeyboardEvent
        if ((keyEvent.keyCode || keyEvent.which) == 13) {
            // Press enter
            fieldNameDialogOpen = false
            return false
        }
    }
</script>

<IconButton
    onclick={() => (fieldNameDialogOpen = true)}
    color="on-primary"
    icon="create"
/>

<Dialog bind:open={fieldNameDialogOpen} title="Edit Field">
    Change type
    <br />
    <div class="field_types">
        <Button
            class="field_type_button"
            icon="title"
            color="secondary"
            variant={type === 'text' ? 'standard' : 'outlined'}
            onclick={() => (type = 'text')}
        />
        <Button
            class="field_type_button"
            icon="vpn_key"
            color="secondary"
            variant={type === 'password' ? 'standard' : 'outlined'}
            onclick={() => (type = 'password')}
        />
        <Button
            class="field_type_button"
            icon="email"
            color="secondary"
            variant={type === 'email' ? 'standard' : 'outlined'}
            onclick={() => (type = 'email')}
        />
        <Button
            class="field_type_button"
            icon="link"
            color="secondary"
            variant={type === 'url' ? 'standard' : 'outlined'}
            onclick={() => (type = 'url')}
        />
    </div>
    <br />
    Rename
    <br />
    <TextInput
        class="field_name"
        onkeypress={onKeyPressFieldLabel}
        bind:value={label}
    />

    {#snippet actions()}
        {#if deleteConfirmation}
            <Button
                color="secondary"
                variant="outlined"
                onclick={() => (deleteConfirmation = false)}
            >
                Cancel
            </Button>
            <Button color="danger" onclick={onDelete}>Delete</Button>
        {:else}
            <Button color="danger" onclick={() => (deleteConfirmation = true)}>
                Delete
            </Button>
            <Button
                color="secondary"
                variant="outlined"
                onclick={() => (fieldNameDialogOpen = false)}
            >
                Close
            </Button>
        {/if}
    {/snippet}
</Dialog>

<style>
    :global(.field_types) {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        width: 100%;
        overflow: hidden;
        flex-wrap: wrap;
    }
    :global(.menu_field_type) {
        margin-top: 310px;
        margin-left: -60px;
        min-width: 60px;
        width: 60px;
        z-index: 999999;
        box-sizing: border-box;
    }
    :global(.field_type_button) {
        margin-top: 10px;
    }
    :global(.field_name) {
        width: 100%;
    }
</style>
