// https://css-tricks.com/how-to-recreate-the-ripple-effect-of-material-design-buttons
export function createRipple(event, forceCenter) {
    const button = event.currentTarget

    const circle = document.createElement('span')

    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    circle.style.width = circle.style.height = `${diameter}px`
    if (forceCenter) {
        circle.style.left = `${button.left - radius}px`
        circle.style.top = `${button.rigth - radius}px`
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
