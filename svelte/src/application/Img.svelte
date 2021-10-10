<script>
    export let src = null;
    export let alt = null;
    let className = '';
    export { className as class };

    let noimageSet = false;

    function onError(event) {
        if (event.target.src !== 'img/noimage.svg' && !noimageSet) {
            noimageSet = true;
            event.target.src = 'img/noimage.svg';
        }
    }

</script>

<img class="{className}" src="{src}" alt="{alt}" on:error="{onError}" />
