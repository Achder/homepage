import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async (context) => {
    const { origin, searchParams } = new URL(context.request.url)
    const target = searchParams.get('url')
    if (!target) {
        return new Response('No URL provided', { status: 400 })
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // skip initial animations
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])

    // Ensure the target URL is safe and secure
    // We make sure to use the origin of the request URL
    const targetUrl = new URL(target)
    const { pathname: targetPath, searchParams: targetSearchParams } = targetUrl
    const safeUrl = `${origin}${targetPath}?${targetSearchParams.toString()}`

    await page.goto(safeUrl)
    const elementHandle = await page.$('#svg-controls')
    await page.evaluate((el) => {
        el?.scrollIntoView({ behavior: 'auto', block: 'center' })
    }, elementHandle)

    await new Promise((resolve) => setTimeout(resolve, 50))
    const imageBuffer = await page.screenshot({ type: 'png' })
    await browser.close()

    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/png',
        },
    })
}
