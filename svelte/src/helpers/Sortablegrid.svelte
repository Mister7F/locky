<script>
    let {
        items,
        dragging = $bindable(false),
        movable = true,
        class: className = '',
        // List of [dom_id], when an item is dropped on the specified DOM id
        // the event "action" is called
        customActions = [],
        onmove = null,
        onmove_blocked = null,
        onaction = null,
        card,
    } = $props()

    function getElementIndex(element) {
        // Return the index of the element in its parent
        const children = [...element.parentNode.children].filter(
            (c) =>
                !c.classList.contains('ghost') &&
                !c.classList.contains('dragged')
        )
        return [].indexOf.call(children, element)
    }

    // On desktop, the drag even is triggered when a threshold is reached
    // for the movement of the mouse. So we do not interpret "click" events as
    // drag events
    let pressedElementEvent = null
    let desktopDragMove = [0, 0]

    let dragX = $state(null)
    let dragY = $state(null)

    let draggedIndex = $state(-1)
    let draggedItem = $state(null)
    let destIndex = $state(-1) // used for the UI
    let destIndexItem = -1 // used to send the event
    let action = null
    let gridElement = $state()

    // Position of the mouse on the dragged element
    let xPosElement = 0
    let yPosElement = 0
    let mouseTimer = null
    let mobile = false

    function moveDraggedElement(event) {
        // move the dragged element to the mouse position
        let mouseX
        let mouseY

        if (event.touches) {
            // mobile
            mouseX = event.touches[0].clientX
            mouseY = event.touches[0].clientY
        } else if (!mobile) {
            // desktop
            mouseX = event.x
            mouseY = event.y
        } else {
            // mouse move event on mobile, must ignore
            return [null, null]
        }
        dragX = mouseX - xPosElement
        dragY = mouseY - yPosElement
        return [mouseX, mouseY]
    }

    function touchStart(event) {
        if (event.button !== 0 && !event.touches) {
            return
        }

        // on mobile, should press and wait a bit before dragging
        // (because we should be able to scroll)
        const clonedEvent = cloneEvent(event)
        mouseTimer = setTimeout(() => {
            initDrag(clonedEvent)
        }, 300)
    }

    function mouseDown(event) {
        if (event.button !== 0 && !event.touches) {
            return
        }

        // on desktop, we start to drag if we press the mouse and move it
        pressedElementEvent = cloneEvent(event)
        desktopDragMove = [0, 0]
    }

    function mouseUp(event) {
        pressedElementEvent = null

        if (mouseTimer) {
            clearTimeout(mouseTimer)
        }
        if (!dragging || (event.button !== 0 && !event.touches)) {
            return
        }
        if (action) {
            onaction({
                action: action,
                item: draggedItem,
            })
        } else if (
            draggedIndex !== destIndexItem &&
            destIndexItem >= 0 &&
            draggedIndex >= 0
        ) {
            onmove({
                from: draggedIndex,
                to: destIndexItem,
                fromItem: draggedItem,
                destItem: items[destIndexItem],
            })
        }

        // clean the state
        draggedItem = null
        draggedIndex = -1
        destIndex = -1
        destIndexItem = -1
        dragging = false
        action = null
        const previousFolder = document.querySelector('.move_into')
        if (previousFolder) {
            previousFolder.classList.remove('move_into')
        }
    }

    function mouseMove(event) {
        if (pressedElementEvent) {
            desktopDragMove[0] += event.movementX
            desktopDragMove[1] += event.movementY
            const dragMove = Math.sqrt(
                desktopDragMove[0] * desktopDragMove[0] +
                    desktopDragMove[1] * desktopDragMove[1]
            )

            if (dragMove > 15) {
                // on desktop, start to drag with a mouse move
                initDrag(pressedElementEvent)
                pressedElementEvent = null
            }
        }

        if (mouseTimer) {
            clearTimeout(mouseTimer)
        }
        if (!dragging) {
            return
        }
        let [mouseX, mouseY] = moveDraggedElement(event)

        if (mouseX === null || mouseY === null) {
            return
        }

        event.stopPropagation()
        event.preventDefault()

        // move the ghost element if necessary
        let hoverElements = document.elementsFromPoint(mouseX, mouseY)

        /* Check for custom actions */
        let customActionElement = hoverElements.filter(
            (el) => customActions.indexOf(el.id) >= 0
        )
        if (customActionElement.length) {
            action = customActionElement[0]
            // Todo: rename `move_into` into `action_hover`
            let previousFolder = document.querySelector('.move_into')
            if (previousFolder) {
                previousFolder.classList.remove('move_into')
            }
            action.classList.add('move_into')
            return
        }
        // no action
        action = null
        // check if we will move the item
        const destItemsFiltered = hoverElements.filter(
            (el) =>
                gridElement.contains(el) &&
                el.classList.contains('dnd_container') &&
                !el.classList.contains('ghost') &&
                !el.classList.contains('dragged')
        )

        if (destItemsFiltered.length) {
            let nextIndex = getElementIndex(destItemsFiltered[0])
            if (draggedIndex < destIndex) {
                nextIndex += 1
            }
            if (destIndex <= nextIndex) {
                nextIndex += 1
            }
            destIndexItem = nextIndex > draggedIndex ? nextIndex - 1 : nextIndex
            destIndex = nextIndex

            const previousFolder = document.querySelector('.move_into')
            if (previousFolder) {
                previousFolder.classList.remove('move_into')
            }
        } else {
            const previousFolder = document.querySelector('.move_into')
            if (previousFolder) {
                previousFolder.classList.remove('move_into')
            }
        }
    }

    /**
     * Initiate the dragging
     *
     * - on Desktop, to trigger this, you need to press the element and then move
     *   the mouse
     * - on Mobile, you need to press the element and wait a bit. This is because
     *   you can also "press" the screen to scroll
     */
    function initDrag(event) {
        const target = event.target.closest('.dnd_container')
        if (!movable) {
            // try to move, but can't
            onmove_blocked()
            return
        }

        draggedIndex = getElementIndex(target)

        draggedItem = items[draggedIndex]
        if (event.touches) {
            // mobile
            xPosElement = target.offsetWidth / 2
            yPosElement = target.offsetHeight / 2
            mobile = true
        } else {
            // desktop
            xPosElement = event.x - target.offsetLeft
            yPosElement = event.y - target.getBoundingClientRect().top
            mobile = false
        }
        moveDraggedElement(event)

        dragging = true
    }

    function cloneEvent(e) {
        if (e === undefined || e === null) return undefined
        function ClonedEvent() {}
        let clone = new ClonedEvent()
        for (let p in e) {
            let d = Object.getOwnPropertyDescriptor(e, p)
            if (d && (d.get || d.set)) Object.defineProperty(clone, p, d)
            else clone[p] = e[p]
        }
        Object.setPrototypeOf(clone, e)
        return clone
    }

    $effect(() => {
        const body = document.body
        body.addEventListener('mouseup', mouseUp, { passive: true })
        body.addEventListener('touchend', mouseUp, { passive: true })
        body.addEventListener('mousemove', mouseMove, { passive: false })
        body.addEventListener('touchmove', mouseMove, { passive: false })
    })
</script>

<div
    class="grid {className}
    {dragging ? 'dragging' : ''}"
    oncontextmenu={() => false}
    bind:this={gridElement}
>
    <div class="items">
        {#each items as item, index (item.id || JSON.stringify(item))}
            {#if dragging && index === destIndex}
                <div class="dnd_container ghost">
                    {#if card}
                        {@render card(draggedItem)}
                    {/if}
                </div>
            {/if}
            <div
                class="dnd_container {item === draggedItem ? 'dragged' : ''}"
                onmousedown={mouseDown}
                ontouchstart={touchStart}
                oncontextmenu={(event) => event.preventDefault()}
                style="--x: {dragX}px; --y: {dragY}px;"
            >
                {#if card}
                    {@render card(item)}
                {/if}
            </div>
        {/each}

        {#if dragging && items.length === destIndex}
            <div class="dnd_container ghost">
                {#if card}
                    {@render card(draggedItem)}
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .grid {
        overflow-x: hidden;
        overflow-y: auto;
        max-height: 100%;
        background: transparent;
    }

    .items {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: space-around;
        align-items: flex-start;
        align-content: flex-start;
    }

    .dnd_container {
        width: auto;
        display: block;
        transition: -webkit-filter 0.5s;
    }

    .dnd_container > * {
        width: auto;
        display: block;
        cursor: pointer;
    }

    .dragged {
        position: absolute;
        left: var(--x);
        top: var(--y);
        opacity: 0.2;
        transform: rotate(-3deg);
        z-index: 99;
        pointer-events: none;
    }

    .ghost {
        pointer-events: none;
        opacity: 0;
    }

    :global(.move_into) {
        background-color: color-mix(in srgb, #4a6572 20%, transparent);
    }

    .dragging,
    .dragging *,
    :global(body:has(.dragging)),
    :global(body:has(.dragging) *) {
        cursor: -webkit-grabbing !important;
        cursor: -moz-grabbing !important;
        cursor: grabbing !important;
    }
</style>
