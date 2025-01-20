import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
    const { searchParams } = new URL(context.request.url)
    const url = searchParams.get('url')

    if (!url) {
        return new Response('No URL provided', { status: 400 })
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    })
    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto(url)
    await page.evaluate(() => {
        document.body.style.zoom = '0.65'
    })
    const imageBuffer = await page.screenshot({ type: 'png' })
    await browser.close()

    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/png',
        },
    })
}
