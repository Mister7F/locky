<script lang="ts">
    import Button from './Button.svelte'

    interface Props {
        onremoved: () => void
        onuploaded: (data: ArrayBuffer) => void
    }

    let filedata: ArrayBuffer | undefined
    let filename = $state<string | undefined>()
    let fileInput: HTMLInputElement | undefined

    let { onremoved, onuploaded }: Props = $props()

    let truncatedFilename = $derived(
        !filename || filename.length <= 18
            ? filename
            : filename.substr(0, 15) + '...'
    )

    async function onFileUploaded(event: Event) {
        const target = event.target as HTMLInputElement | null

        const file = target?.files && target.files.length && target.files[0]
        if (!file) {
            filename = null
            filedata = null
            onremoved()
            return
        }

        filename = file.name
        onuploaded(await file.arrayBuffer())
    }
</script>

<Button
    class="file_input_button"
    color="secondary"
    variant="outlined"
    icon="file_upload"
    onclick={() => fileInput.click()}
>
    {truncatedFilename || 'Upload'}
</Button>
<input onchange={onFileUploaded} type="file" bind:this={fileInput} />

<style>
    :global(.file_input_button) {
        width: 100%;
    }
    input {
        display: none;
    }
</style>
