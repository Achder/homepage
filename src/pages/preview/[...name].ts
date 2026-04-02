import puppeteer from 'puppeteer'
import type { APIRoute } from 'astro'
import type { Page } from 'puppeteer'

export const prerender = false
const ogWidth = 1200
const ogHeight = 630
const captureScale = 4
const ogAspectRatio = 1200 / 630
const indexPreviewToken = '__index__'

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
        await page.evaluate((element) => {
            element?.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
        }, elementHandle)
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        })
    } catch {
        // Ignore unknown selectors and fall back to a broader page capture.
    }
}

async function getVisibleTarget(page: Page, selectors: string[]) {
    for (const selector of selectors) {
        const element = await page.$(selector)

        if (!element) {
            continue
        }

        const bounds = await element.boundingBox()

        if (bounds && bounds.width > 0 && bounds.height > 0) {
            return element
        }
    }

    return null
}

export const GET: APIRoute = async (context) => {
    const rawName = context.params.name
    const { origin, searchParams } = new URL(context.request.url)
    const name = rawName?.replace(/^\/+|\/+$/g, '') ?? indexPreviewToken
    const selector = searchParams.get('selector')?.trim() || undefined

    if (!name) {
        return new Response('Missing preview target', { status: 400 })
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox'],
    })

    try {
        const page = await browser.newPage()
        await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
        await page.evaluateOnNewDocument(() => {
            const disableAnimations = () => {
                const style = document.createElement('style')
                style.innerHTML = `
                    *,
                    *::before,
                    *::after {
                        animation: none !important;
                        transition: none !important;
                        scroll-behavior: auto !important;
                    }
                `

                document.head?.appendChild(style)
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', disableAnimations, { once: true })
                return
            }

            disableAnimations()
        })
        await page.setViewport({
            width: ogWidth,
            height: ogHeight,
            deviceScaleFactor: captureScale,
        })

        const safePath = name === indexPreviewToken ? '/' : `/${name}`
        const safeUrl = new URL(safePath, origin)
        safeUrl.search = searchParams.toString()
        safeUrl.searchParams.delete('selector')

        const response = await page.goto(safeUrl.toString(), {
            waitUntil: 'domcontentloaded',
        })

        if (!response || !response.ok()) {
            return new Response('Unable to render preview target', { status: 502 })
        }

        await waitForLayout(page, selector)

        const previewTarget = await getVisibleTarget(
            page,
            selector ? [selector, '#container', '#svg', 'main', 'body'] : ['#container', '#svg', 'main', 'body']
        )

        if (!previewTarget) {
            return new Response('Unable to find preview target', { status: 500 })
        }

        const previewTargetId = await previewTarget.evaluate((element) => element.id)
        const useStructuredClip = previewTargetId === 'container' || previewTargetId === 'svg'

        await previewTarget.evaluate((element) => {
            element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' })
        })
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
        })

        const previewMetrics = await page.evaluate(() => {
            const container = document.querySelector('#container')
            const svg = document.querySelector('#svg')

            const containerBounds =
                container instanceof HTMLElement
                    ? {
                          x: container.getBoundingClientRect().x,
                          y: container.getBoundingClientRect().y,
                          width: container.getBoundingClientRect().width,
                          height: container.getBoundingClientRect().height,
                      }
                    : null
            const containerOutlineInset =
                container instanceof HTMLElement
                    ? (() => {
                          const styles = window.getComputedStyle(container)
                          const outlineWidth = Number.parseFloat(styles.outlineWidth) || 0
                          const outlineOffset = Number.parseFloat(styles.outlineOffset) || 0

                          return outlineOffset < 0 ? Math.min(outlineWidth, Math.abs(outlineOffset)) : 0
                      })()
                    : 0

            if (!(svg instanceof SVGSVGElement)) {
                return { containerBounds, containerOutlineInset, contentBounds: null }
            }

            const svgWidth = svg.width.baseVal.value
            const svgHeight = svg.height.baseVal.value
            const points = [...svg.children].flatMap((element) => {
                if (!(element instanceof SVGGraphicsElement)) {
                    return []
                }

                if (element instanceof SVGRectElement) {
                    const x = element.x.baseVal.value
                    const y = element.y.baseVal.value
                    const width = element.width.baseVal.value
                    const height = element.height.baseVal.value

                    if (x === 0 && y === 0 && width === svgWidth && height === svgHeight) {
                        return []
                    }
                }

                const bbox = element.getBBox()
                const matrix = element.getScreenCTM()

                if (!matrix || bbox.width <= 0 || bbox.height <= 0) {
                    return []
                }

                return [
                    new DOMPoint(bbox.x, bbox.y),
                    new DOMPoint(bbox.x + bbox.width, bbox.y),
                    new DOMPoint(bbox.x, bbox.y + bbox.height),
                    new DOMPoint(bbox.x + bbox.width, bbox.y + bbox.height),
                ].map((point) => point.matrixTransform(matrix))
            })

            if (points.length === 0) {
                return { containerBounds, containerOutlineInset, contentBounds: null }
            }

            const xValues = points.map((point) => point.x)
            const yValues = points.map((point) => point.y)

            return {
                containerBounds,
                containerOutlineInset,
                contentBounds: {
                    x: Math.min(...xValues),
                    y: Math.min(...yValues),
                    width: Math.max(...xValues) - Math.min(...xValues),
                    height: Math.max(...yValues) - Math.min(...yValues),
                },
            }
        })
        const scrollOffset = await page.evaluate(() => ({
            x: window.scrollX,
            y: window.scrollY,
        }))
        const pageTitle = await page.evaluate(() => {
            const heading = document.querySelector('h1')?.textContent?.trim()
            if (heading) {
                return heading
            }

            return document.title.split('|')[0]?.trim() || 'Preview'
        })
        const bb = await previewTarget.boundingBox()
        const clip = bb && (selector || useStructuredClip)
            ? (() => {
                  const baseBounds = useStructuredClip ? previewMetrics.containerBounds ?? bb : bb
                  const outlineInset = previewMetrics.containerOutlineInset ?? 0
                  const insetBounds =
                      useStructuredClip && outlineInset > 0
                          ? {
                                x: baseBounds.x + outlineInset,
                                y: baseBounds.y + outlineInset,
                                width: Math.max(baseBounds.width - outlineInset * 2, 1),
                                height: Math.max(baseBounds.height - outlineInset * 2, 1),
                            }
                          : baseBounds
                  const focusBounds = useStructuredClip ? previewMetrics.contentBounds ?? insetBounds : insetBounds
                  const sourceAspectRatio = insetBounds.width / insetBounds.height

                  if (sourceAspectRatio > ogAspectRatio) {
                      const width = insetBounds.height * ogAspectRatio
                      const centeredX = focusBounds.x + focusBounds.width / 2 - width / 2
                      const x = Math.max(insetBounds.x, Math.min(centeredX, insetBounds.x + insetBounds.width - width))

                      return {
                          x: scrollOffset.x + x,
                          y: scrollOffset.y + insetBounds.y,
                          width,
                          height: insetBounds.height,
                      }
                  }

                  const height = insetBounds.width / ogAspectRatio
                  const centeredY = focusBounds.y + focusBounds.height / 2 - height / 2
                  const y = Math.max(insetBounds.y, Math.min(centeredY, insetBounds.y + insetBounds.height - height))

                  return {
                      x: scrollOffset.x + insetBounds.x,
                      y: scrollOffset.y + y,
                      width: insetBounds.width,
                      height,
                  }
              })()
            : undefined

        const croppedImageBuffer = clip
            ? await page.screenshot({
                  type: 'png',
                  clip,
              })
            : await page.screenshot({
                  type: 'png',
              })

        const outputPage = await browser.newPage()
        await outputPage.setViewport({
            width: ogWidth,
            height: ogHeight,
            deviceScaleFactor: 1,
        })
        await outputPage.setContent(`<!doctype html>
<html>
    <body style="margin:0;background:black">
        <div id="frame">
            <img id="image" alt="" />
            <div id="overlay"></div>
            <div id="title"></div>
        </div>
    </body>
</html>`)

        const croppedImageUrl = `data:image/png;base64,${Buffer.from(croppedImageBuffer).toString('base64')}`

        await outputPage.evaluate(({ imageUrl, pageTitle }) => {
            const frame = document.querySelector('#frame')
            const image = document.querySelector('#image')
            const overlay = document.querySelector('#overlay')
            const title = document.querySelector('#title')

            if (!(frame instanceof HTMLDivElement)) {
                return
            }

            if (!(image instanceof HTMLImageElement)) {
                return
            }

            frame.setAttribute(
                'style',
                'position:relative;width:100vw;height:100vh;overflow:hidden;background:black;font-family:system-ui,sans-serif;'
            )
            image.src = imageUrl
            image.setAttribute(
                'style',
                'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;'
            )

            if (overlay instanceof HTMLDivElement) {
                overlay.setAttribute(
                    'style',
                    'position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 28%, rgba(0,0,0,0) 55%);pointer-events:none;'
                )
            }

            if (title instanceof HTMLDivElement) {
                title.textContent = pageTitle
                title.setAttribute(
                    'style',
                    'position:absolute;left:48px;right:48px;bottom:40px;color:white;font-size:64px;line-height:1.05;font-weight:800;letter-spacing:-0.03em;text-wrap:balance;text-shadow:0 2px 16px rgba(0,0,0,0.45);'
                )
            }
        }, { imageUrl: croppedImageUrl, pageTitle })

        const imageBuffer = await outputPage.screenshot({
            type: 'png',
        })

        if (!imageBuffer) {
            return new Response('Unable to capture preview', { status: 500 })
        }

        const responseBody = new Uint8Array(imageBuffer.byteLength)
        responseBody.set(imageBuffer)

        return new Response(new Blob([responseBody], { type: 'image/png' }), {
            headers: {
                'Content-Type': 'image/png',
            },
        })
    } finally {
        await browser.close()
    }
}
