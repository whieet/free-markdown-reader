// Screenshot harness for Markdown Reader.
//
// Chrome 149 removed the `--load-extension` switch, so we load the *built*
// extension (dist/chrome-mv3) the modern way: spawn the system Chrome with a
// remote-debugging port + `--enable-unsafe-extension-debugging`, connect over
// CDP, and call the browser-level `Extensions.loadUnpacked`. The demo markdown
// is served as text/plain over a local server so the content script takes over
// the page exactly as it would for a real file. We then drive chrome.storage
// (via the extension's service worker) to switch panels / themes and capture
// real PNGs at 2x DPR. No mockups — every image is the live UI.

import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const EXE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const EXT = path.join(ROOT, 'dist', 'chrome-mv3')
const OUT = path.join(HERE, 'img')
const DEMO_FILE = path.join(HERE, 'demo-folder', 'index.md')
const DEMO = fs.readFileSync(DEMO_FILE, 'utf8')
const PORT = 9333
const DPR = 2
const W = 1366
const H = 860

fs.mkdirSync(OUT, { recursive: true })

const PLUGINS = [
  'emoji', 'sub', 'sup', 'ins', 'mark', 'abbr', 'deflist', 'footnote',
  'taskLists', 'tableOfContents', 'container', 'alert', 'katex', 'mermaid',
]
const ALL_ON = Object.fromEntries(PLUGINS.map((k) => [k, true]))

function mk(overrides = {}) {
  return {
    enable: true,
    centered: true,
    refresh: false,
    theme: 'light',
    language: 'en',
    panel: 'outline',
    mdPlugins: ALL_ON,
    ...overrides,
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function getJson(url) {
  return new Promise((res, rej) => {
    http
      .get(url, (r) => {
        let d = ''
        r.on('data', (c) => (d += c))
        r.on('end', () => res(JSON.parse(d)))
      })
      .on('error', rej)
  })
}

async function main() {
  // 1. Local server: serve the demo markdown as text/plain for any path.
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(DEMO)
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const mdPort = server.address().port
  const url = `http://127.0.0.1:${mdPort}/demo.md`
  console.log('serving', url)

  // 2. Spawn headed Chrome with a debugging port (persistent default profile,
  //    where extensions are allowed to run).
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdr-shots-'))
  const chrome = spawn(
    EXE,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${userDataDir}`,
      '--enable-unsafe-extension-debugging',
      '--no-first-run',
      '--no-default-browser-check',
      '--hide-crash-restore-bubble',
      'about:blank',
    ],
    { stdio: 'ignore', detached: true },
  )

  // 3. Connect over CDP and load the unpacked extension via the browser session.
  let ver
  for (let i = 0; i < 50 && !ver; i++) {
    try {
      ver = await getJson(`http://127.0.0.1:${PORT}/json/version`)
    } catch {
      await sleep(300)
    }
  }
  if (!ver) throw new Error('Chrome debugging endpoint never came up')
  console.log('connected:', ver['Browser'])

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`)
  const bs = await browser.newBrowserCDPSession()
  const { id: extId } = await bs.send('Extensions.loadUnpacked', { path: EXT })
  console.log('extension id', extId)

  const ctx = browser.contexts()[0]

  // 4. Grab the extension's service worker (to write chrome.storage).
  let sw = ctx.serviceWorkers().find((w) => w.url().includes(extId))
  for (let i = 0; i < 30 && !sw; i++) {
    await sleep(300)
    sw = ctx.serviceWorkers().find((w) => w.url().includes(extId))
  }
  if (!sw) throw new Error('extension service worker not found')

  const applySettings = (s) =>
    sw.evaluate(
      (v) =>
        new Promise((res) =>
          chrome.storage.local.set({ settings: v, 'local:settings': v }, res),
        ),
      s,
    )

  // 5. Open the content page at 2x DPR.
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: W,
    height: H,
    deviceScaleFactor: DPR,
    mobile: false,
    screenWidth: W,
    screenHeight: H,
  })
  await page.emulateMedia({ colorScheme: 'light' })

  async function waitRender() {
    await page.waitForSelector('#mdr-root .md-app', { timeout: 25000 })
    await page
      .waitForFunction(
        () => {
          const m = document.querySelector('.md-mermaid')
          return !m || !!m.querySelector('svg')
        },
        { timeout: 25000 },
      )
      .catch(() => console.warn('mermaid wait timed out'))
    await page.waitForSelector('.katex', { timeout: 8000 }).catch(() => {})
    await sleep(500)
  }

  const shot = async (name, opts = {}) => {
    await page.screenshot({ path: path.join(OUT, name), ...opts })
    console.log('wrote', name)
  }

  // First load: light theme, outline panel.
  await applySettings(mk())
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitRender()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('reading-light.png')

  // Dark theme.
  await applySettings(mk({ theme: 'dark' }))
  await sleep(400)
  await waitRender()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('reading-dark.png')

  // Settings panel (light). Done before search so no stale highlights leak in.
  await applySettings(mk({ theme: 'light', panel: 'settings' }))
  await page.waitForSelector('.md-settings', { timeout: 8000 })
  await sleep(300)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('settings.png')

  // Math + diagram close-up (light, panel collapsed for width).
  await applySettings(mk({ theme: 'light', panel: null }))
  await sleep(300)
  await waitRender()
  await page.evaluate(() => {
    const math = [...document.querySelectorAll('h2')].find((e) =>
      /math/i.test(e.textContent || ''),
    )
    const dia = [...document.querySelectorAll('h2')].find((e) =>
      /diagram/i.test(e.textContent || ''),
    )
    ;(math || dia)?.scrollIntoView({ block: 'start' })
    window.scrollBy(0, -24)
  })
  await sleep(400)
  await shot('diagram.png')

  // Search panel with a live query + highlights (light). Last, because the
  // <mark> highlights it injects persist in the DOM after the panel closes.
  await applySettings(mk({ theme: 'light', panel: 'search' }))
  await page.waitForSelector('.md-search input', { timeout: 8000 })
  await page.fill('.md-search input', 'Markdown')
  await page.press('.md-search input', 'Enter')
  await sleep(400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('search.png')

  // Folder panel — needs a real file:// page so the sibling listing is live.
  // (CDP-loaded extensions get "Allow access to file URLs" by default.)
  await applySettings(mk({ theme: 'light', panel: 'folder' }))
  await page.goto(pathToFileURL(DEMO_FILE).href, {
    waitUntil: 'domcontentloaded',
  })
  await waitRender()
  await page.waitForSelector('.md-folder li', { timeout: 8000 }).catch(() => {
    console.warn('folder list did not populate')
  })
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot('folder.png')

  // Popup (light).
  const pop = await ctx.newPage()
  const pcdp = await ctx.newCDPSession(pop)
  await pcdp.send('Emulation.setDeviceMetricsOverride', {
    width: 460,
    height: 760,
    deviceScaleFactor: DPR,
    mobile: false,
    screenWidth: 460,
    screenHeight: 760,
  })
  await pop.emulateMedia({ colorScheme: 'light' })
  await pop.goto(`chrome-extension://${extId}/popup.html`, {
    waitUntil: 'domcontentloaded',
  })
  await pop.waitForSelector('.pop', { timeout: 8000 })
  await sleep(400)
  const el = await pop.$('.pop')
  await el.screenshot({ path: path.join(OUT, 'popup.png') })
  console.log('wrote popup.png')

  await browser.close()
  server.close()
  try {
    process.kill(-chrome.pid)
  } catch {}
  console.log('done ->', OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
