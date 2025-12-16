<script lang="ts">
    interface Props {
        src?: string
        alt?: string
        class?: string
        style?: string
        noimageSet?: boolean
    }

    let {
        src = '',
        alt = '',
        class: className = '',
        style = '',
        noimageSet = false,
    }: Props = $props()

    function onError(event: Event) {
        const target = event.target as HTMLImageElement | null
        if (target?.src !== 'img/noimage.svg' && !noimageSet) {
            noimageSet = true
            target.src = 'img/noimage.svg'
        }
    }
</script>

<img class={className} {src} {alt} onerror={onError} {style} />

<style>
    img {
        pointer-events: none;
    }
</style>
