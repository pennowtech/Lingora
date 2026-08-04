import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rawDir = '/private/tmp/claude-501/-Users-sukhdeep-singh-Mine-Lingora/2fae4954-5252-42db-b5fa-3f93eaf5ecfe/scratchpad/raw'
const outDir = path.join(__dirname, 'final')
fs.mkdirSync(outDir, { recursive: true })

async function run() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1024, height: 500 } })
  await page.goto('file://' + path.join(__dirname, 'feature-graphic-template.html'))

  const shot1 = fs.readFileSync(path.join(rawDir, '02-word-detail.png'))
  const shot2 = fs.readFileSync(path.join(rawDir, '05b-review-back.png'))

  await page.evaluate(
    ({ src1, src2 }) => {
      document.getElementById('shot1').src = src1
      document.getElementById('shot2').src = src2
    },
    {
      src1: 'data:image/png;base64,' + shot1.toString('base64'),
      src2: 'data:image/png;base64,' + shot2.toString('base64'),
    },
  )
  await page.waitForTimeout(100)
  await page.screenshot({ path: path.join(outDir, 'feature-graphic.png') })
  console.log('wrote feature-graphic.png')

  await browser.close()
}

run()
