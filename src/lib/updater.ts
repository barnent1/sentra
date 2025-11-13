/**
 * Tauri Auto-Updater Integration
 *
 * Provides automatic update checking and installation for Sentra desktop app.
 * Uses Tauri's built-in updater plugin with GitHub Releases backend.
 *
 * @module lib/updater
 */

import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateInfo {
  version: string
  currentVersion: string
  body?: string
  date?: string
}

export interface UpdateProgress {
  chunkLength: number
  contentLength?: number
}

/**
 * Check for available updates from GitHub Releases
 *
 * @returns Update info if available, null if up-to-date
 * @throws Error if update check fails
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    const update = await check()

    if (!update) {
      console.log('[Updater] No update available - app is up to date')
      return null
    }

    console.log(
      `[Updater] Update available: ${update.version} (current: ${update.currentVersion})`
    )

    return {
      version: update.version,
      currentVersion: update.currentVersion,
      body: update.body,
      date: update.date,
    }
  } catch (error) {
    console.error('[Updater] Failed to check for updates:', error)
    throw error
  }
}

/**
 * Download and install available update
 *
 * @param onProgress - Optional callback for download progress
 * @returns True if update was installed, false if no update available
 * @throws Error if update installation fails
 */
export async function installUpdate(
  onProgress?: (progress: UpdateProgress) => void
): Promise<boolean> {
  try {
    const update = await check()

    if (!update) {
      console.log('[Updater] No update available to install')
      return false
    }

    console.log(`[Updater] Downloading update ${update.version}...`)

    // Download and install with progress tracking
    let downloaded = 0
    let contentLength: number | undefined

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started':
          contentLength = event.data.contentLength
          console.log(
            `[Updater] Download started (${contentLength ? `${Math.round(contentLength / 1024 / 1024)}MB` : 'unknown size'})`
          )
          break

        case 'Progress':
          downloaded += event.data.chunkLength
          if (onProgress) {
            onProgress({
              chunkLength: event.data.chunkLength,
              contentLength,
            })
          }
          if (contentLength) {
            const percent = Math.round((downloaded / contentLength) * 100)
            console.log(`[Updater] Download progress: ${percent}%`)
          }
          break

        case 'Finished':
          console.log('[Updater] Download complete, installing...')
          break
      }
    })

    console.log('[Updater] Update installed successfully, restarting app...')

    // Relaunch the app to apply update
    await relaunch()

    return true
  } catch (error) {
    console.error('[Updater] Failed to install update:', error)
    throw error
  }
}

/**
 * Check for updates and prompt user to install if available
 *
 * @param silent - If true, don't show notification when no update available
 * @returns True if update was installed, false otherwise
 */
export async function checkAndInstallUpdate(
  silent: boolean = false
): Promise<boolean> {
  try {
    const updateInfo = await checkForUpdates()

    if (!updateInfo) {
      if (!silent) {
        console.log('[Updater] App is up to date')
      }
      return false
    }

    // In production, this would show a dialog
    // For now, we'll auto-install (can be customized)
    console.log('[Updater] Installing update...')
    return await installUpdate()
  } catch (error) {
    console.error('[Updater] Update check failed:', error)
    return false
  }
}

/**
 * Initialize updater with automatic check on startup
 *
 * Call this in your app initialization code to check for updates
 * when the app starts (only in production builds)
 */
export function initializeUpdater(): void {
  // Only check for updates in production builds
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Updater] Auto-update disabled in development mode')
    return
  }

  console.log('[Updater] Initializing auto-updater...')

  // Check for updates on startup (after a delay)
  setTimeout(() => {
    checkAndInstallUpdate(true).catch((error) => {
      console.error('[Updater] Startup update check failed:', error)
    })
  }, 5000) // Wait 5 seconds after app start

  // Check for updates periodically (every 4 hours)
  setInterval(
    () => {
      checkAndInstallUpdate(true).catch((error) => {
        console.error('[Updater] Periodic update check failed:', error)
      })
    },
    4 * 60 * 60 * 1000
  ) // 4 hours
}
