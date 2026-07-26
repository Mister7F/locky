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

    interface ActivePointer {
        id: number
        type: string
        target: HTMLElement
        startX: number
        startY: number
        x: number
        y: number
    }

    let activePointer: ActivePointer | undefined
    let holdTimer: number | undefined

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

    // Position of the pointer on the dragged element
    let xPosElement = 0
    let yPosElement = 0

    /**
     * Save the latest pointer position and schedule a visual/drop-target update.
     */
    function moveDraggedElement(pointerX: number, pointerY: number) {
        nextPointerX = pointerX
        nextPointerY = pointerY
        nextDragX = pointerX - xPosElement
        nextDragY = pointerY - yPosElement
        if (dragAnimationFrame === undefined) {
            dragAnimationFrame = requestAnimationFrame(updateDragFrame)
        }
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
    function flushDragFrame(pointerX: number, pointerY: number) {
        nextPointerX = pointerX
        nextPointerY = pointerY
        if (dragAnimationFrame !== undefined) {
            cancelAnimationFrame(dragAnimationFrame)
            dragAnimationFrame = undefined
        }
        updateDropTarget(nextPointerX, nextPointerY)
    }

    /**
     * Remember a primary pointer and capture its events until release.
     */
    function pointerDown(event: PointerEvent) {
        if (!event.isPrimary || event.button !== 0) {
            return
        }
        const target = (event.target as HTMLElement | null)?.closest(
            '.dnd_container'
        ) as HTMLElement | null
        if (!target || !gridElement?.contains(target)) {
            return
        }

        resetDrag()
        activePointer = {
            id: event.pointerId,
            type: event.pointerType,
            target,
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX,
            y: event.clientY,
        }
        target.setPointerCapture(event.pointerId)

        if (event.pointerType === 'touch') {
            holdTimer = window.setTimeout(startDrag, 300)
        }
    }

    /**
     * Start desktop dragging after movement, or preserve touch scrolling.
     */
    function pointerMove(event: PointerEvent) {
        if (!activePointer || event.pointerId !== activePointer.id) {
            return
        }

        activePointer.x = event.clientX
        activePointer.y = event.clientY

        if (!dragging) {
            const distance = Math.hypot(
                event.clientX - activePointer.startX,
                event.clientY - activePointer.startY
            )
            if (activePointer.type === 'touch') {
                if (distance > 10) {
                    resetDrag()
                }
                return
            }
            if (distance <= 15) {
                return
            }
            startDrag()
        }

        if (!dragging) {
            return
        }
        moveDraggedElement(event.clientX, event.clientY)
        event.stopPropagation()
        event.preventDefault()
    }

    /**
     * Complete the current move or custom drop action, then reset drag state.
     */
    function pointerUp(event: PointerEvent) {
        if (!activePointer || event.pointerId !== activePointer.id) {
            return
        }
        if (!dragging) {
            resetDrag()
            return
        }

        flushDragFrame(event.clientX, event.clientY)
        if (action) {
            if (draggedItem) {
                onaction?.({
                    action,
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
        event.stopPropagation()
        event.preventDefault()
        resetDrag()
    }

    /**
     * Initiate dragging from the currently active pointer.
     */
    function startDrag() {
        if (!activePointer) {
            return
        }
        if (!movable) {
            onmove_blocked?.()
            resetDrag()
            return
        }
        if (holdTimer !== undefined) {
            clearTimeout(holdTimer)
            holdTimer = undefined
        }

        const target = activePointer.target
        draggedElement = target
        draggedIndex = getElementIndex(target)
        draggedItem = items[draggedIndex]

        const targetRect = target.getBoundingClientRect()
        if (activePointer.type === 'touch') {
            xPosElement = targetRect.width / 2
            yPosElement = targetRect.height / 2
        } else {
            xPosElement = activePointer.startX - targetRect.left
            yPosElement = activePointer.startY - targetRect.top
        }

        dragging = true
        moveDraggedElement(activePointer.x, activePointer.y)
    }

    /**
     * Prevent iOS from scrolling the page after a touch drag has started.
     */
    function preventTouchScroll(event: TouchEvent) {
        if (dragging) {
            event.preventDefault()
        }
    }

    /**
     * Release pointer capture and remove all transient drag state.
     */
    function resetDrag() {
        if (holdTimer !== undefined) {
            clearTimeout(holdTimer)
            holdTimer = undefined
        }
        if (
            activePointer &&
            activePointer.target.hasPointerCapture(activePointer.id)
        ) {
            activePointer.target.releasePointerCapture(activePointer.id)
        }
        activePointer = undefined
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
        setAction()
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
        const element = gridElement
        element?.addEventListener('touchmove', preventTouchScroll, {
            passive: false,
        })
        window.addEventListener('blur', resetDrag)
        return () => {
            resetDrag()
            element?.removeEventListener('touchmove', preventTouchScroll)
            window.removeEventListener('blur', resetDrag)
        }
    })
</script>

<div
    class="grid {className}
    {dragging ? 'dragging' : ''}"
    oncontextmenu={() => false}
    onpointerdown={pointerDown}
    onpointermove={pointerMove}
    onpointerup={pointerUp}
    onpointercancel={resetDrag}
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
