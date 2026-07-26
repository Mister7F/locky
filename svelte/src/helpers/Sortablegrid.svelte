<script lang="ts" generics="DragItem extends { id: any }">
    interface Props {
        items: DragItem[]
        dragging?: boolean
        movable?: boolean
        class?: string
        customActions?: string[]
        onmove?: (payload: {
            from: number
            to: number
            fromItem: DragItem
            destItem: DragItem
        }) => void
        onmove_blocked?: () => void
        onaction?: (payload: { action: HTMLElement; item: DragItem }) => void
        card?: (item: DragItem) => any
    }

    let {
        items = [],
        dragging = $bindable(false),
        movable = true,
        class: className = '',
        // List of [dom_id], when an item is dropped on the specified DOM id
        // the event "action" is called
        customActions = [],
        onmove,
        onmove_blocked,
        onaction,
        card,
    }: Props = $props()

    /**
     * Return an element's index while ignoring drag placeholders.
     */
    function getElementIndex(element) {
        // Return the index of the element in its parent
        const children = [...element.parentNode.children].filter(
            (c) =>
                !c.classList.contains('ghost') &&
                !c.classList.contains('dragged')
        )
        return [].indexOf.call(children, element)
    }

    function isTouchEvent(e: MouseEvent | TouchEvent): e is TouchEvent {
        return 'touches' in e
    }

    function isMouseEvent(e: MouseEvent | TouchEvent): e is MouseEvent {
        return 'clientX' in e && !('touches' in e)
    }

    // On desktop, the drag even is triggered when a threshold is reached
    // for the movement of the mouse. So we do not interpret "click" events as
    // drag events
    let pressedElementEvent: MouseEvent | TouchEvent | undefined
    let desktopDragMove = [0, 0]

    let draggedElement: HTMLElement | undefined
    let dragAnimationFrame: number | undefined
    let nextDragX = 0
    let nextDragY = 0
    let nextPointerX = 0
    let nextPointerY = 0

    // Do not load all items for performance reason (items will be loaded dynamically when scrolling)
    const minCardSurface = 432 * 78
    const initialSlice = Math.ceil(
        (window.innerWidth * window.innerHeight) / minCardSurface
    )
    let currentSlice = $state(initialSlice)

    let draggedIndex = $state(-1)
    let draggedItem = $state<DragItem>()
    let destIndex = $state(-1) // used for the UI
    let destIndexItem = -1 // used to send the event
    let action: HTMLElement | undefined
    let gridElement = $state<HTMLElement>()

    // Position of the mouse on the dragged element
    let xPosElement = 0
    let yPosElement = 0
    let mouseTimer: number | undefined
    let mobile = false

    /**
     * Save the latest pointer position and schedule a visual/drop-target update.
     */
    function moveDraggedElement(event: MouseEvent | TouchEvent) {
        const position = getPointerPosition(event)
        if (!position) {
            return false
        }
        const [mouseX, mouseY] = position
        nextPointerX = mouseX
        nextPointerY = mouseY
        nextDragX = mouseX - xPosElement
        nextDragY = mouseY - yPosElement
        if (dragAnimationFrame === undefined) {
            dragAnimationFrame = requestAnimationFrame(updateDragFrame)
        }
        return true
    }

    /**
     * Read viewport coordinates from either a mouse or touch event.
     */
    function getPointerPosition(
        event: MouseEvent | TouchEvent
    ): [number, number] | undefined {
        if (isTouchEvent(event)) {
            const touch = event.touches[0] || event.changedTouches[0]
            return touch && [touch.clientX, touch.clientY]
        }
        if (mobile) {
            // Ignore synthetic mouse events generated after a touch.
            return
        }
        return [event.clientX, event.clientY]
    }

    /**
     * Apply the latest drag position and hit-test once per animation frame.
     */
    function updateDragFrame() {
        draggedElement?.style.setProperty('--x', `${nextDragX}px`)
        draggedElement?.style.setProperty('--y', `${nextDragY}px`)
        updateDropTarget(nextPointerX, nextPointerY)
        dragAnimationFrame = undefined
    }

    /**
     * Process the final pointer position synchronously before completing a drop.
     */
    function flushDragFrame(event: MouseEvent | TouchEvent) {
        const position = getPointerPosition(event)
        if (position) {
            nextPointerX = position[0]
            nextPointerY = position[1]
        }
        if (dragAnimationFrame !== undefined) {
            cancelAnimationFrame(dragAnimationFrame)
            dragAnimationFrame = undefined
        }
        updateDropTarget(nextPointerX, nextPointerY)
    }

    /**
     * Start a touch drag after a short hold, while preserving normal scrolling.
     */
    function touchStart(event) {
        if (event.button !== 0 && !event.touches) {
            return
        }
        if (mouseTimer !== undefined) {
            clearTimeout(mouseTimer)
        }

        // on mobile, should press and wait a bit before dragging
        // (because we should be able to scroll)
        const clonedEvent = cloneEvent(event)
        mouseTimer = setTimeout(() => {
            initDrag(clonedEvent)
        }, 300)
    }

    /**
     * Remember the initial press until desktop movement exceeds the threshold.
     */
    function mouseDown(event: MouseEvent | TouchEvent) {
        if (!isTouchEvent(event) && event.button !== 0) {
            return
        }

        // on desktop, we start to drag if we press the mouse and move it
        pressedElementEvent = cloneEvent(event)
        desktopDragMove = [0, 0]
    }

    /**
     * Complete the current move or custom drop action, then reset drag state.
     */
    function mouseUp(event: MouseEvent | TouchEvent) {
        pressedElementEvent = null

        if (mouseTimer) {
            clearTimeout(mouseTimer)
            mouseTimer = undefined
        }
        if (!dragging || (isMouseEvent(event) && event.button !== 0)) {
            return
        }
        flushDragFrame(event)
        if (action) {
            if (draggedItem) {
                onaction?.({
                    action: action,
                    item: draggedItem,
                })
            }
        } else if (
            draggedIndex !== destIndexItem &&
            destIndexItem >= 0 &&
            draggedIndex >= 0
        ) {
            if (draggedItem && items[destIndexItem]) {
                onmove?.({
                    from: draggedIndex,
                    to: destIndexItem,
                    fromItem: draggedItem,
                    destItem: items[destIndexItem],
                })
            }
        }
        resetDrag()
    }

    /**
     * Abort a drag when the browser cancels the gesture or loses focus.
     */
    function cancelDrag() {
        resetDrag()
    }

    /**
     * Remove transient styles, timers, highlights, and drag state.
     */
    function resetDrag() {
        pressedElementEvent = undefined
        if (mouseTimer !== undefined) {
            clearTimeout(mouseTimer)
            mouseTimer = undefined
        }
        if (dragAnimationFrame !== undefined) {
            cancelAnimationFrame(dragAnimationFrame)
            dragAnimationFrame = undefined
        }
        draggedElement?.style.removeProperty('--x')
        draggedElement?.style.removeProperty('--y')
        draggedElement = undefined
        draggedItem = undefined
        draggedIndex = -1
        destIndex = -1
        destIndexItem = -1
        dragging = false
        mobile = false
        setAction()
    }

    /**
     * Start or update a drag in response to pointer movement.
     */
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

        if (mouseTimer !== undefined) {
            clearTimeout(mouseTimer)
            mouseTimer = undefined
        }
        if (!dragging) {
            return
        }
        if (!moveDraggedElement(event)) {
            return
        }

        event.stopPropagation()
        event.preventDefault()
    }

    /**
     * Hit-test the pointer and update the custom action or reorder destination.
     */
    function updateDropTarget(mouseX: number, mouseY: number) {
        // move the ghost element if necessary
        let hoverElements = document.elementsFromPoint(mouseX, mouseY)

        /* Check for custom actions */
        let customActionElement = hoverElements.find(
            (el) => customActions.indexOf(el.id) >= 0
        )
        if (customActionElement) {
            setAction(customActionElement as HTMLElement)
            return
        }
        // no action
        setAction()
        // check if we will move the item
        const destItemsFiltered = hoverElements.filter(
            (el) =>
                gridElement &&
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
        }
    }

    /**
     * Update the highlighted custom drop action.
     */
    function setAction(newAction?: HTMLElement) {
        if (action === newAction) {
            return
        }
        action?.classList.remove('move_into')
        action = newAction
        action?.classList.add('move_into')
    }

    /**
     * Initiate the dragging
     *
     * - on Desktop, to trigger this, you need to press the element and then move
     *   the mouse
     * - on Mobile, you need to press the element and wait a bit. This is because
     *   you can also "press" the screen to scroll
     */
    function initDrag(event: MouseEvent | TouchEvent) {
        const target = (event.target as HTMLElement | null)?.closest(
            '.dnd_container'
        ) as HTMLElement | null
        if (!movable) {
            // try to move, but can't
            onmove_blocked?.()
            return
        }

        if (!target) {
            return
        }

        draggedElement = target
        draggedIndex = getElementIndex(target)

        draggedItem = items[draggedIndex]
        const targetRect = target.getBoundingClientRect()
        if (isTouchEvent(event)) {
            // mobile
            xPosElement = targetRect.width / 2
            yPosElement = targetRect.height / 2
            mobile = true
        } else {
            // desktop
            xPosElement = event.clientX - targetRect.left
            yPosElement = event.clientY - targetRect.top
            mobile = false
        }
        moveDraggedElement(event)

        dragging = true
    }

    /**
     * Snapshot an event whose browser-owned properties may become unavailable.
     */
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

    /**
     * Load the next item batch when the grid reaches its scroll boundary.
     */
    function onScroll(event: Event) {
        const element = event.currentTarget as HTMLElement
        if (
            element.scrollTop + element.clientHeight <
            element.scrollHeight - 1
        ) {
            return
        }

        currentSlice = Math.min(items.length, currentSlice + initialSlice)
    }

    $effect(() => {
        const body = document.body
        body.addEventListener('mouseup', mouseUp, { passive: true })
        body.addEventListener('touchend', mouseUp, { passive: true })
        body.addEventListener('touchcancel', cancelDrag, { passive: true })
        body.addEventListener('mousemove', mouseMove, { passive: false })
        body.addEventListener('touchmove', mouseMove, { passive: false })
        window.addEventListener('blur', cancelDrag)
        return () => {
            cancelDrag()
            body.removeEventListener('mouseup', mouseUp)
            body.removeEventListener('touchend', mouseUp)
            body.removeEventListener('touchcancel', cancelDrag)
            body.removeEventListener('mousemove', mouseMove)
            body.removeEventListener('touchmove', mouseMove)
            window.removeEventListener('blur', cancelDrag)
        }
    })
</script>

<div
    class="grid {className}
    {dragging ? 'dragging' : ''}"
    oncontextmenu={() => false}
    onscroll={onScroll}
    bind:this={gridElement}
>
    <div class="items">
        {#each items.slice(0, currentSlice) as item, index (item.id || JSON.stringify(item))}
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
            >
                {#if card}
                    {@render card(item)}
                {/if}
            </div>
        {/each}

        {#if dragging && items.slice(0, currentSlice).length === destIndex}
            <div class="dnd_container ghost">
                {#if card}
                    {@render card(draggedItem)}
                {/if}
            </div>
        {/if}

        {#if currentSlice < items.length}
            <span
                class="load_more"
                onclick={() => (currentSlice = items.length)}
                >Load more {items.length - currentSlice} elements</span
            >
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
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
    }

    .dnd_container > * {
        width: auto;
        display: block;
        cursor: pointer;
    }

    .dragged {
        position: fixed;
        left: 0;
        top: 0;
        opacity: 0.2;
        transform: translate3d(var(--x), var(--y), 0) rotate(-3deg);
        will-change: transform;
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

    .load_more {
        display: block;
        flex: 0 0 100%;
        min-height: 48px;
        padding: 12px 0 20px;
        box-sizing: border-box;
        text-align: center;
        cursor: pointer;
    }
</style>
