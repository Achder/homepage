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
            filter: 'blur(2px) hue-rotate(180deg)',
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
            filter: 'blur(0px) hue-rotate(0deg)',
            duration: 0.5,
            stagger: 0.2,
            ease: 'power1.out',
        }
    )
}
