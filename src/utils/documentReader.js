import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = pdfjsWorker

const MAX_TEXT_LENGTH = 10000
const TEXT_EXTENSIONS = ['txt', 'csv', 'json', 'md', 'log']

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

async function extractTextFromPdf(file) {
  const buffer = await readFileAsArrayBuffer(file)
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map((item) => item.str).join(' ')
    pages.push(pageText)
  }
  return pages.join('\n\n')
}

export async function extractTextFromFile(file) {
  try {
    const ext = (file.name || '').split('.').pop()?.toLowerCase() || ''

    if (ext === 'pdf') {
      const text = await extractTextFromPdf(file)
      return text.slice(0, MAX_TEXT_LENGTH)
    }

    if (TEXT_EXTENSIONS.includes(ext)) {
      const text = await readFileAsText(file)
      return text.slice(0, MAX_TEXT_LENGTH)
    }

    return ''
  } catch (err) {
    console.error('Error extracting text from file:', file.name, err)
    return ''
  }
}
