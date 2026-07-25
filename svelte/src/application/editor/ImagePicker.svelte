<script lang="ts">
    import IconButton from '../../helpers/IconButton.svelte'

    import Icon from '../../helpers/Icon.svelte'
    import { onMount } from 'svelte'
    import Field from '../../helpers/field/Field.svelte'
    import Img from '../../helpers/Img.svelte'
    import Dialog from '../../helpers/Dialog.svelte'
    import Button from '../../helpers/Button.svelte'

    interface Props {
        src: string
        chooseIcon?: boolean
        readonly: boolean
        size: string
        srcs: string[]
    }

    let {
        src = $bindable(''),
        chooseIcon = false,
        readonly = false,
        size = '100px',
        srcs = $bindable([]),
    }: Props = $props()

    let editedSrc = $state('')
    let searchValue = $state('')
    let downloadError = $state('')
    let svgDialogOpen = $state(false)
    let svgCode = $state('')
    let svgError = $state('')

    const MAX_STORED_IMAGE_SIZE = 1024 * 1024

    let currentSrcs = $derived(
        !searchValue || !searchValue.length
            ? srcs
            : srcs.filter((url) => {
                  return (
                      url.toLowerCase().indexOf(searchValue.toLowerCase()) >= 0
                  )
              })
    )

    // Fetch the list of account logos
    onMount(async () => {
        let response = await fetch('img/accounts/files.txt')
        srcs = (await response.text())
            .split(/\r?\n/)
            .filter((url) => url && url.length)
            .map((src) => 'img/accounts/' + src)
    })

    function open() {
        if (readonly) {
            return
        }
        editedSrc = src
        chooseIcon = true
    }

    function close() {
        editedSrc = src
        searchValue = ''
        downloadError = ''
        chooseIcon = false
    }

    function choose(isrc: string) {
        searchValue = ''
        downloadError = ''
        src = isrc
        editedSrc = isrc
        chooseIcon = false
    }

    async function downloadAndChoose() {
        downloadError = ''

        try {
            const response = await fetch(editedSrc, {
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
            })
            if (!response.ok) {
                throw new Error(`Image download failed (${response.status})`)
            }

            const image = await response.blob()
            if (!image.type.startsWith('image/')) {
                throw new Error('The URL did not return an image')
            }
            if (image.size > MAX_STORED_IMAGE_SIZE) {
                throw new Error('The image is larger than 1 MiB')
            }

            choose(await blobToDataUri(image))
        } catch (error) {
            console.error(error)
            downloadError =
                error instanceof TypeError
                    ? 'The image could not be downloaded (the server may block cross-origin access)'
                    : error instanceof Error
                      ? error.message
                      : 'The image could not be downloaded'
        }
    }

    function blobToDataUri(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(blob)
        })
    }

    async function storeSvg() {
        svgError = ''

        if (svgCode.length > MAX_STORED_IMAGE_SIZE) {
            svgError = 'The SVG is larger than 1 MiB'
            return
        }

        const dataUri = await blobToDataUri(
            new Blob([svgCode], { type: 'image/svg+xml' })
        )
        svgDialogOpen = false
        svgCode = ''
        choose(dataUri)
    }
</script>

<div class="image_picker" style="--size: {size}">
    <div class="img {readonly ? 'readonly' : ''}" onclick={open}>
        <Img
            src={src || 'img/accounts/default.svg'}
            alt={src || 'img/accounts/default.svg'}
        />
    </div>
    <div class="icons {chooseIcon && !readonly ? 'visible' : ''}">
        <div class="img-header">
            <div class="url">
                <Field
                    label="Image URL"
                    copy={false}
                    bind:value={editedSrc}
                    message={downloadError}
                    messagePersistent={true}
                    oninput={() => (downloadError = '')}
                />
                <div class="url-actions">
                    <IconButton
                        title="Use image URL"
                        onclick={() => choose(editedSrc)}
                        icon="link"
                    />
                    <IconButton
                        title="Download and store image"
                        onclick={downloadAndChoose}
                        icon="download"
                    />
                    <IconButton
                        title="Enter SVG code"
                        onclick={() => {
                            svgError = ''
                            svgDialogOpen = true
                        }}
                        icon="code"
                    />
                    <IconButton
                        title="Close image picker"
                        onclick={close}
                        icon="close"
                    />
                </div>
            </div>
            <Field label="Search" copy={false} bind:value={searchValue} />
        </div>
        <div class="container">
            {#each currentSrcs as iconSrc}
                <img
                    src={iconSrc}
                    onclick={() => choose(iconSrc)}
                    alt={iconSrc}
                />
            {/each}
        </div>
    </div>
</div>

<Dialog bind:open={svgDialogOpen} title="Store SVG code">
    <textarea
        bind:value={svgCode}
        oninput={() => (svgError = '')}
        placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot;>…</svg>"
        spellcheck="false"
    ></textarea>
    {#if svgError}
        <div class="svg-error">{svgError}</div>
    {/if}

    {#snippet actions()}
        <Button
            onclick={() => (svgDialogOpen = false)}
            color="secondary"
            variant="outlined"
        >
            Cancel
        </Button>
        <Button onclick={storeSvg} color="primary">Store SVG</Button>
    {/snippet}
</Dialog>

<style>
    .image_picker {
        width: 100%;
        max-height: 100%;
    }

    .img {
        position: relative;
        cursor: pointer;
        width: var(--size);
        height: var(--size);
        margin: auto;
        max-width: 100%;
        max-height: 100%;
        padding: 2px;
        box-sizing: border-box;
        overflow: hidden;
    }

    .img :global(img) {
        transition: transform 150ms ease;
    }

    .img:not(.readonly):hover :global(img) {
        transform: scale(1.03);
    }

    .image_picker :global(svg),
    .image_picker :global(Img),
    img {
        max-width: 100%;
        max-height: 100%;
        height: var(--size);
        margin: auto;
    }

    .readonly {
        cursor: default;
    }
    .icons {
        position: absolute;
        z-index: 99999999;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow: hidden;
        height: 0;
        transition: 0.4s;
        padding: 0 20px;
        box-sizing: border-box;
        transition-timing-function: ease-in-out;
        background-color: var(--primary);
    }

    .icons.visible {
        height: 100vh;
    }

    .icons img {
        max-width: 40px;
        max-height: 40px;
        margin: 10px;
        cursor: pointer;
    }

    .container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        flex: 1;
        flex-wrap: wrap;
        min-height: 0;
        overflow: hidden;
        overflow-y: auto;
        width: 90%;
        margin: 0 auto;
        padding-top: 10px;
        box-sizing: border-box;
    }

    .container::after {
        /* To align the last row to the left */
        content: '';
        flex: auto;
    }

    .img-header {
        flex: none;
        width: 100%;
        padding-top: 15px;
        background-color: var(--primary);
        z-index: 1;
    }

    .url {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .url > :global(.field) {
        flex: 1;
        min-width: 0;
    }

    .url-actions {
        display: flex;
        flex-direction: row;
    }

    textarea {
        box-sizing: border-box;
        width: min(600px, 70vw);
        height: min(350px, 50vh);
        resize: vertical;
        border: 1px solid var(--on-primary);
        border-radius: 4px;
        padding: 10px;
        color: var(--on-primary);
        background: var(--primary);
        font-family: monospace;
    }

    textarea:focus {
        border-color: var(--secondary);
        outline: none;
    }

    .svg-error {
        margin-top: 8px;
        color: var(--error);
    }
</style>
