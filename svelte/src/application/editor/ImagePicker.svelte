<script>
    import IconButton from '../../helpers/IconButton.svelte'

    import Icon from '../../helpers/Icon.svelte'
    import { onMount } from 'svelte'
    import Field from '../../helpers/field/Field.svelte'
    import Img from '../../helpers/Img.svelte'

    let {
        src = $bindable(''),
        chooseIcon = false,
        readonly = false,
        size = '100px',
        srcs = $bindable([]),
    } = $props()

    let currentSrcs = $derived(
        !searchValue || !searchValue.length
            ? srcs
            : srcs.filter((url) => {
                  return (
                      url.toLowerCase().indexOf(searchValue.toLowerCase()) > 0
                  )
              })
    )

    let searchValue = $state('')

    // Fetch the list of account logos
    onMount(async () => {
        let response = await fetch('img/accounts/files.txt')
        srcs = (await response.text())
            .split(/\r?\n/)
            .filter((url) => url && url.length)
            .map((src) => 'img/accounts/' + src)
    })

    function open() {
        chooseIcon = readonly ? false : true
    }

    function choose(isrc) {
        searchValue = ''
        src = isrc
        chooseIcon = false
    }
</script>

<div class="image_picker" style="--size: {size}">
    <div class="img {readonly ? 'readonly' : ''}" onclick={open}>
        {#if src}
            <Img {src} alt={src} />
        {:else}<img src="img/accounts/default.svg" alt="default" />{/if}
    </div>
    <div class="icons {chooseIcon && !readonly ? 'visible' : ''}">
        <div class="img-header">
            <div class="url">
                <Field label="Image URL" copy="0" bind:value={src} />
                <IconButton onclick={() => choose(src)} icon="save_alt" />
            </div>
            <Field label="Search" copy="0" bind:value={searchValue} />
        </div>
        <div class="container">
            {#each currentSrcs as src}
                <img {src} onclick={() => choose(src)} alt={src} />
            {/each}
        </div>
    </div>
</div>

<style>
    .image_picker {
        width: 100%;
        max-height: 100%;
    }

    .img {
        cursor: pointer;
        width: var(--size);
        margin: auto;
        max-width: 100%;
        max-height: 100%;
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
        width: 100%;
        overflow-y: scroll;
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
        flex-wrap: wrap;
        margin-top: 10px;
        max-height: calc(100% - 155px);
        overflow: hidden;
        overflow-y: auto;
        width: 90%;
        margin: auto;
        padding-top: 10px;
    }

    .container::after {
        /* To align the last row to the left */
        content: '';
        flex: auto;
    }

    .img-header {
        width: 100%;
        position: sticky;
        height: 140px;
        padding-top: 15px;
    }

    .url {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
    }

    .url > :global(.field) {
        width: 80%;
    }
</style>
