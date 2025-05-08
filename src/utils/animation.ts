import { gsap } from 'gsap'

export function fadeIn(
    elementSelector: string,
    scrollTriggerSelector: string,
    options?: {
        startOffset?: number | string
        scrub?: boolean
    }
) {
    const { startOffset, scrub } = options ?? {}

    gsap.fromTo(
        elementSelector,
        {
            opacity: 0,
            y: startOffset ?? '100%',
        },
        {
            scrollTrigger: {
                trigger: scrollTriggerSelector,
                start: 'top bottom-=100px',
                end: 'bottom top',
                scrub,
            },
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.2,
            ease: 'sine',
        }
    )
}
