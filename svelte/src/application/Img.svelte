<script>
    export let src = null;
    export let alt = null;
    let className = '';
    export { className as class };

    function onError(event) {
        if (event.target.src !== 'img/noimage.svg') {
            event.target.src = 'img/noimage.svg';
        }
    }

</script>

<img class="{className}" src="{src}" alt="{alt}" on:error="{onError}" />
