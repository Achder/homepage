import { gsap } from 'gsap'

export function fadeIn(elementSelector: string, scrollTriggerSelector: string, startOffset?: number | string) {
    gsap.fromTo(
        elementSelector,
        {
            opacity: 0,
            y: startOffset ?? '100%',
        },
        {
            scrollTrigger: scrollTriggerSelector,
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.2,
            ease: 'sine',
        }
    )
}
