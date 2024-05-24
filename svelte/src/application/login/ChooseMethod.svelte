<script>
    import Button, { Group, GroupItem, Label, Icon } from '@smui/button'
    import { createEventDispatcher } from 'svelte'

    const dispatch = createEventDispatcher()

    export let sessionOpened = false
</script>

<h1>Open your wallet</h1>
<div class="container">
    {#if sessionOpened}
        <Button
            color="secondary"
            variant="outlined"
            on:click={() => dispatch('click', 'login')}
        >
            <Icon class="material-icons">login</Icon>
            <Label>Unlock the session</Label>
        </Button>
    {/if}
    <Button
        color="secondary"
        variant="outlined"
        on:click={() => dispatch('click', 'create')}
    >
        <Icon class="material-icons">add</Icon>
        <Label>Create a new wallet</Label>
    </Button>
    <Button
        color="secondary"
        variant="outlined"
        on:click={() => dispatch('click', 'upload')}
    >
        <Icon class="material-icons">file_upload</Icon>
        <Label>Upload a file</Label>
    </Button>
    <Button
        color="secondary"
        variant="outlined"
        on:click={() => dispatch('click', 'dropbox')}
    >
        <svg viewBox="0 0 56.693 56.693" width="56.693px">
            <polygon
                points="3.535,33.956 18.132,43.481 28.347,34.962 13.628,25.878 "
            ></polygon>
            <polygon
                points="18.132,8.275 3.535,17.796 13.628,25.878 28.347,16.793 "
            ></polygon>
            <polygon
                points="53.158,17.796 38.561,8.275 28.347,16.793 43.064,25.878 "
            ></polygon>
            <polygon
                points="28.347,34.962 38.561,43.481 53.158,33.956 43.064,25.878 "
            ></polygon>
            <polygon
                points="28.377,36.794 18.132,45.29 13.748,42.427 13.748,45.638
                28.377,54.405 43.005,45.638 43.005,42.427 38.621,45.29 "
            ></polygon>
        </svg>
        <Label>Dropbox</Label>
    </Button>
</div>

<style>
    h1 {
        color: var(--on-surface);
    }
    .container {
        width: 250px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 200px;
    }
    svg {
        height: 25px;
        width: 25px;
        margin-right: 5px;
        fill: var(--secondary);
    }
</style>
