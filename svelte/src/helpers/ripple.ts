// https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons
// https://m2.material.io/develop/ios/supporting/ripple
export function createRipple(event: MouseEvent, forceCenter?: boolean) {
    const button = event.currentTarget as HTMLElement | null
    if (!button) {
        return
    }

    const start = performance.now()

    button.classList.add('ripple_pressed')

    function onMouseUp() {
        button.removeEventListener('mouseup', onMouseUp)
        button.removeEventListener('mousemove', onMouseUp)

        const ellapsed = performance.now() - start
        setTimeout(() => {
            button.classList.remove('ripple_pressed')
        }, 250 - ellapsed) // animation time if we just click
    }
    button.addEventListener('mouseup', onMouseUp)
    button.addEventListener('mousemove', onMouseUp)

    const circle = document.createElement('span')

    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    circle.style.width = circle.style.height = `${diameter}px`
    if (forceCenter) {
        circle.style.left = `${(button as any).left - radius}px`
        circle.style.top = `${(button as any).rigth - radius}px`
    } else {
        circle.style.left = `${event.clientX - button.offsetLeft - radius}px`
        circle.style.top = `${event.clientY - button.offsetTop - radius}px`
    }
    circle.classList.add('ripple_effect')

    const ripple = button.getElementsByClassName('ripple_effect')[0]
    if (ripple) {
        ripple.remove()
    }
    button.appendChild(circle)
}
