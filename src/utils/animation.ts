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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const to: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        filter: 'blur(0px) hue-rotate(0deg)',
    }

    if (prefersReducedMotion) {
        gsap.to(elementSelector, to)
    } else {
        gsap.fromTo(
            elementSelector,
            {
                opacity: 0,
                y: startOffset ?? '100%',
                filter: 'blur(2px) hue-rotate(180deg)',
            },
            {
                ...to,
                scrollTrigger: {
                    trigger: scrollTriggerSelector,
                    start: 'top bottom-=100px',
                    end: 'bottom top',
                    scrub,
                },
                duration: 0.5,
                stagger: 0.2,
                ease: 'power1.out',
            }
        )
    }
}
