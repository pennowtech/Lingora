import { chromium } from 'playwright'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rawDir = path.join(__dirname, '..', '..', 'PENDING_MANUAL_TESTS_SCRATCH', 'raw')
const rawDirActual = '/private/tmp/claude-501/-Users-sukhdeep-singh-Mine-Lingora/2fae4954-5252-42db-b5fa-3f93eaf5ecfe/scratchpad/raw'
const outDir = path.join(__dirname, 'final')
fs.mkdirSync(outDir, { recursive: true })

const shots = [
  { file: '01-search-word.png', headline: 'Type any German word.\nGet a lesson back.', mask: true },
  { file: '02-word-detail.png', headline: 'One word. Every angle\nyou need to learn it.' },
  { file: '03-mining-queue.png', headline: 'Heard a word on Netflix?\nSave it before you forget it.' },
  { file: '04-home.png', headline: 'Your German,\none glance away.' },
  { file: '05-review-session.png', headline: 'Swipe. Rate. Let the\nalgorithm do the rest.' },
  { file: '06-cloze-practice.png', headline: 'Recognizing a word isn’t\nthe same as producing it.' },
  { file: '07-reverse-practice.png', headline: 'Learn it both directions—\nnot just one.' },
  { file: '09-more-info.png', headline: 'Confused by Konjunktiv II?\nGet it explained, right here.' },
  { file: '10-ai-providers.png', headline: 'Bring your own AI key.\nNo markup, no subscription.' },
  { file: '11-local-dictionaries.png', headline: 'No AI key?\nThousands of words, ready offline.' },
  { file: '14-backup-export.png', headline: 'Already on Anki?\nBring your decks with you.' },
  { file: '13b-template-preview.png', headline: 'Design your own flashcards.\nReal CSS, real preview.' },
  { file: '15-theme-picker.png', headline: 'Six themes.\nStudy in the one that feels like you.' },
  { file: '16-decks.png', headline: 'Nest your decks, merge them,\nmake them yours.' },
  { file: '18-cloud-sync.png', headline: 'Start on your phone.\nPick it up on your tablet.' },
  { file: '19-privacy.png', headline: 'Your API keys stay\non your device. Always.' },
  { file: '20-add-card-manually.png', headline: 'Not every card has\nto come from AI.' },
  { file: 'bonus-statistics.png', headline: 'See exactly how well\nyou actually know it.' },
  { file: '21-follow-up-question.png', headline: 'Wait, how is that different\nfrom the other word? Just ask.' },
  { file: '24-advanced-grammar-result.png', headline: 'Pick a grammar point.\nGet real examples, not a textbook.' },
]

const sourceDir = fs.existsSync(rawDirActual) ? rawDirActual : rawDir

async function run() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1200, height: 1820 } })
  const templatePath = path.join(__dirname, 'template.html')
  await page.goto('file://' + templatePath)

  for (const shot of shots) {
    const imgPath = path.join(sourceDir, shot.file)
    if (!fs.existsSync(imgPath)) {
      console.error(`MISSING: ${imgPath}`)
      continue
    }
    const dataUri = 'data:image/png;base64,' + fs.readFileSync(imgPath).toString('base64')
    await page.evaluate(
      ({ src, headline, mask }) => {
        const img = document.getElementById('shot')
        img.src = src
        const h = document.getElementById('headline')
        h.innerHTML = headline.split('\n').join('<br/>')
        const m = document.getElementById('mask')
        m.classList.toggle('show', !!mask)
      },
      { src: dataUri, headline: shot.headline, mask: !!shot.mask },
    )
    await page.waitForTimeout(80)
    const outName = shot.file.replace(/\.png$/, '-marketing.png')
    await page.screenshot({ path: path.join(outDir, outName) })
    console.log('wrote', outName)
  }

  await browser.close()
}

run()
