// Background service worker. Routes messages from content scripts:
//   - fetch     : proxy a fetch (works for file:// + http(s) hot-reload)
//   - listDir   : fetch + parse the parent file:// directory
//   - pushCommand : broadcast a keyboard command to the active tab
// And handles chrome.commands by re-broadcasting to the active tab.

import { browser } from 'wxt/browser'
import { listDirectory } from '../lib/dir-listing'
import type { Message, BroadcastCommand } from '../lib/messaging'

export default defineBackground({
  type: 'module',
  main() {
    browser.runtime.onMessage.addListener(
      (msg: Message, _sender, sendResponse) => {
        handle(msg).then(sendResponse).catch((err) => {
          sendResponse({ error: String(err) })
        })
        // Keep the port open for the async response.
        return true
      },
    )

    browser.commands.onCommand.addListener(async (command) => {
      const cmd = command as BroadcastCommand
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      if (tab?.id != null) {
        try {
          await browser.tabs.sendMessage(tab.id, {
            type: 'pushCommand',
            command: cmd,
          })
        } catch {
          // Tab without our content script — ignore.
        }
      }
    })
  },
})

async function handle(msg: Message): Promise<unknown> {
  switch (msg.type) {
    case 'fetch': {
      try {
        const res = await fetch(msg.url)
        return await res.text()
      } catch (err) {
        return undefined
      }
    }
    case 'listDir':
      return listDirectory(msg.url)
    case 'checkFileAccess':
      // `chrome.extension.isAllowedFileSchemeAccess` is only available from
      // extension pages (SW/popup/options), NOT from content scripts.
      // Content scripts route this check here.
      return new Promise<boolean>((resolve) => {
        const ext = browser.extension as typeof browser.extension & {
          isAllowedFileSchemeAccess?: (cb: (ok: boolean) => void) => void
        }
        if (typeof ext.isAllowedFileSchemeAccess === 'function') {
          ext.isAllowedFileSchemeAccess((ok) => resolve(!!ok))
        } else {
          resolve(false)
        }
      })
    default:
      return undefined
  }
}
