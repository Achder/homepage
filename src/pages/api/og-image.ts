import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'
import type { Page } from 'puppeteer'

export const prerender = false

const viewport = {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
}

async function waitForLayout(page: Page, selector?: string) {
    await page.waitForSelector('body')
    await page.evaluate(async () => {
        if ('fonts' in document) {
            await document.fonts.ready
        }

        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    })

    if (!selector) {
        return
    }

    try {
        await page.waitForSelector(selector, { timeout: 1500 })
        const elementHandle = await page.$(selector)
        await page.evaluate((el) => {
            el?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
        }, elementHandle)
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        })
    } catch {
        // Ignore unknown selectors and fall back to the page viewport.
    }
}

export const GET: APIRoute = async (context) => {
    const { origin, searchParams } = new URL(context.request.url)
    const target = searchParams.get('url')
    const selector = searchParams.get('selector')?.trim() || undefined

    if (!target) {
        return new Response('No URL provided', { status: 400 })
    }

    let targetUrl: URL

    try {
        targetUrl = new URL(target)
    } catch {
        return new Response('Invalid URL provided', { status: 400 })
    }

    const { pathname: targetPath, searchParams: targetSearchParams } = targetUrl
    const safeUrl = new URL(targetPath, origin)
    safeUrl.search = targetSearchParams.toString()

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    })

    try {
        const page = await browser.newPage()
        await page.setViewport(viewport)

        // Skip initial animations so screenshots stabilize faster.
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

        const response = await page.goto(safeUrl.toString(), {
            waitUntil: 'domcontentloaded',
        })

        if (!response || !response.ok()) {
            return new Response('Unable to render target URL', { status: 502 })
        }

        await waitForLayout(page, selector)

        const imageBuffer = Buffer.from(await page.screenshot({ type: 'png' }))

        return new Response(imageBuffer, {
            headers: {
                'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
                'Content-Type': 'image/png',
            },
        })
    } finally {
        await browser.close()
    }
}
