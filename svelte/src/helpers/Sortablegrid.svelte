<script>
    import { createEventDispatcher, onMount } from 'svelte'

    export let items
    export let dragging = false

    // if false, can not move the items in the list
    export let movable = true
    let className = ''
    export { className as class }
    // List of [dom_id], when an item is dropped on the specified DOM id
    // the event "action" is called
    export let customActions = []

    const dispatch = createEventDispatcher()

    function getElementIndex(element) {
        // Return the index of the element in its parent
        return [].indexOf.call(element.parentNode.children, element)
    }

    // On desktop, the drag even is triggered when a threshold is reached
    // for the movement of the mouse. So we do not interpret "click" events as
    // drag events
    let pressedElementEvent = null
    let desktopDragMove = [0, 0]

    let draggedElement = null
    let draggedIndex = -1
    let destIndex = -1
    let action = null
    let gridElement
    let ghostElement = null

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
            // mouse move event on mobile
            // must ignore
            return [null, null]
        }
        draggedElement.classList.add('dragged')
        draggedElement.style.setProperty('--x', mouseX - xPosElement + 'px')
        draggedElement.style.setProperty('--y', mouseY - yPosElement + 'px')
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
        if (!draggedElement || (event.button !== 0 && !event.touches)) {
            return
        }
        let draggedItem = items[draggedIndex]
        if (action) {
            dispatch('action', {
                action: action,
                item: draggedItem,
            })
            const parent = ghostElement.parentNode
            ghostElement.remove()
            parent.insertBefore(draggedElement, parent.children[draggedIndex])
        } else if (
            draggedIndex !== destIndex &&
            destIndex >= 0 &&
            draggedIndex >= 0
        ) {
            let destItem = items[destIndex]
            // update the UI
            ghostElement.parentNode.insertBefore(draggedElement, ghostElement)
            ghostElement.remove()
            dispatch('move', {
                from: draggedIndex,
                to: destIndex,
                fromItem: draggedItem,
                destItem: destItem,
            })
        } else {
            // Dropped the element outside of the window
            ghostElement.parentNode.insertBefore(draggedElement, ghostElement)
            ghostElement.remove()
        }
        // clean the state
        draggedElement.classList.remove('dragged')
        draggedElement = null
        draggedIndex = -1
        destIndex = -1
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
        if (!draggedElement) {
            return
        }
        let [mouseX, mouseY] = moveDraggedElement(event)

        if (mouseX === null || mouseY === null) {
            return
        }

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
        // check if will move the item
        let destItemsFiltered = hoverElements.filter(
            (el) =>
                el.classList.contains('container') && gridElement.contains(el)
        )

        destItemsFiltered = destItemsFiltered.filter(
            (el) => el !== draggedElement
        )

        if (destItemsFiltered.length) {
            let destElement = destItemsFiltered[0]
            destIndex = getElementIndex(destElement)
            let previousFolder = document.querySelector('.move_into')
            if (previousFolder) {
                previousFolder.classList.remove('move_into')
            }
            let ghostIndex = getElementIndex(ghostElement)
            if (ghostIndex < destIndex) {
                destElement.parentNode.insertBefore(
                    ghostElement,
                    destElement.nextSibling
                )
            } else {
                // Similar to this, but avoid scroll glitch on mobile
                // destElement.parentNode.insertBefore(ghostElement, destElement);
                ghostElement.parentNode.replaceChild(ghostElement, destElement)
                ghostElement.parentNode.insertBefore(
                    destElement,
                    ghostElement.nextSibling
                )
            }
        } else {
            destIndex = getElementIndex(ghostElement)
            let previousFolder = document.querySelector('.move_into')
            if (previousFolder) {
                previousFolder.classList.remove('move_into')
            }
        }
    }

    /**
     * Init the dragging,
     *
     * - on Desktop, to trigger this, you need to press the element and then move
     *   the mouse
     * - on Mobile, you need to press the element and wait a bit. This is because
     *   you can also "press" the screen to scroll
     */
    function initDrag(event) {
        const target = event.currentTarget
        if (!movable) {
            // try to move, but can't
            dispatch('move_blocked')
            return
        }

        dragging = true
        draggedElement = target
        draggedIndex = getElementIndex(draggedElement)
        if (event.touches) {
            // mobile
            xPosElement = draggedElement.offsetWidth / 2
            yPosElement = draggedElement.offsetHeight / 2
            mobile = true
        } else {
            // desktop
            xPosElement = event.x - draggedElement.offsetLeft
            yPosElement = event.y - draggedElement.getBoundingClientRect().top
            mobile = false
        }
        moveDraggedElement(event)
        // create a ghost element to fill the space
        ghostElement = document.createElement('div')
        ghostElement.style.width = draggedElement.offsetWidth + 'px'
        ghostElement.style.height = draggedElement.offsetHeight + 'px'
        ghostElement.setAttribute('class', 'ghost')
        draggedElement.parentNode.insertBefore(ghostElement, draggedElement)
        document.body.appendChild(draggedElement)
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

    onMount(() => {
        const body = document.body
        body.addEventListener('mouseup', mouseUp, { passive: true })
        body.addEventListener('touchend', mouseUp, { passive: true })
        body.addEventListener('mousemove', mouseMove, { passive: true })
        body.addEventListener('touchmove', mouseMove, { passive: true })
    })
</script>

<div
    class="grid {className}
    {dragging ? 'dragging' : ''}"
    oncontextmenu="return false;"
    bind:this={gridElement}
>
    <div class="items">
        {#each items as item, index (item)}
            <div
                class="container"
                on:mousedown={mouseDown}
                on:touchstart={touchStart}
                on:contextmenu|preventDefault
            >
                <slot name="item" class="item" {item} {index} />
            </div>
        {/each}
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

    .container {
        width: auto;
        display: block;
        transition: -webkit-filter 0.5s;
    }

    .container > * {
        width: auto;
        display: block;
        cursor: pointer;
    }

    :global(.dragged) {
        position: absolute;
        left: var(--x);
        top: var(--y);
        opacity: 0.2;
        transform: rotate(-3deg);
        z-index: 99;
    }

    :global(.dragged),
    :global(.dragged) *,
    :global(.dragged) div {
        cursor: grabbing !important;
        cursor: -moz-grabbing !important;
        cursor: -webkit-grabbing !important;
    }

    :global(.ghost) {
        opacity: 0;
    }

    :global(.move_into) {
        -webkit-filter: brightness(50%);
    }
</style>
