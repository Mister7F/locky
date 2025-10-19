<script>
    let {
        src = null,
        alt = null,
        class: className = '',
        style = '',
        noimageSet = false,
    } = $props()

    function onError(event) {
        if (event.target.src !== 'img/noimage.svg' && !noimageSet) {
            noimageSet = true
            event.target.src = 'img/noimage.svg'
        }
    }
</script>

<img class={className} {src} {alt} onerror={onError} {style} />

<style>
    img {
        pointer-events: none;
    }
</style>
