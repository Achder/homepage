// Downloads a blob, named after the page heading.
export function download(blob: Blob, extension: string) {
    const title = document.querySelector('h1')?.textContent?.trim() || 'your-file'
    const url = URL.createObjectURL(blob)

    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = `${title}.${extension}`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    URL.revokeObjectURL(url)
}
