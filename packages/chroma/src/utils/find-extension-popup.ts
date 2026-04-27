import type { BrowserContext, Page } from '@playwright/test'

export interface FindExtensionPopupOptions {
  maxAttempts?: number
  retryDelay?: number
  viewport?: { width: number, height: number }
}

/**
 * Poll the BrowserContext for a page whose URL points at the given Chrome
 * extension. Returns once the page is reachable and DOM-loaded.
 */
/* c8 ignore start */
export async function findExtensionPopup(
  context: BrowserContext,
  extensionId: string,
  options: FindExtensionPopupOptions = {},
): Promise<Page> {
  const { maxAttempts = 10, retryDelay = 500, viewport } = options

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const p of context.pages()) {
      if (p.url().includes(`chrome-extension://${extensionId}/`)) {
        if (viewport) {
          await p.setViewportSize(viewport)
        }
        await p.waitForLoadState('domcontentloaded')
        return p
      }
    }

    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }

  throw new Error(`Extension popup not found for ID: ${extensionId}`)
}
/* c8 ignore stop */
