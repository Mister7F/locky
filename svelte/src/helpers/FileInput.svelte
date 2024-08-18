<script>
    import Button from './Button.svelte'

    let filedata = null
    let filename = $state(null)
    let fileInput = null

    let { onremoved, onuploaded } = $props()

    let truncatedFilename = $derived(
        !filename || filename.length <= 18
            ? filename
            : filename.substr(0, 15) + '...'
    )

    async function onFileUploaded(event) {
        const target = event.target

        const file = target.files && target.files.length && target.files[0]
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
