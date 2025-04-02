import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'

export const prerender = false

export const GET: APIRoute = async (context) => {
    const { name } = context.params
    const { origin, searchParams } = new URL(context.request.url)

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    })

    const page = await browser.newPage()
    await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
    })

    const safeUrl = `${origin}/${name}?${searchParams.toString()}`
    await page.goto(safeUrl)

    await page.waitForSelector('#svg-controls')
    await page.evaluate(() => {
        const controls = document.querySelector('#svg-controls') as HTMLElement
        if (!controls) {
            return
        }
        controls.style.display = 'none'
    })

    const svg = await page.$('#svg')
    const bb = await svg?.boundingBox()
    const imageBuffer = await svg?.screenshot({
        type: 'jpeg',
        quality: 90,
        clip: bb
            ? {
                  x: 0,
                  y: 0,
                  width: bb?.width - 1,
                  height: bb?.height - 1,
              }
            : undefined,
    })

    await browser.close()

    return new Response(imageBuffer, {
        headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
