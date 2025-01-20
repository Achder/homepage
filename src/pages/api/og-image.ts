import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async (context) => {
    const { searchParams } = new URL(context.request.url)
    const url = searchParams.get('url')

    if (!url) {
        return new Response('No URL provided', { status: 400 })
    }

    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(url)
    const imageBuffer = await page.screenshot({ type: 'png' })
    await browser.close()

    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/png',
        },
    })
}
