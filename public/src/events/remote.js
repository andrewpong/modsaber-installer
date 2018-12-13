const { BrowserWindow, ipcMain } = require('electron')
const log = require('electron-log')
const { fetchMods, fetchGameVersions } = require('../remote/modsaber.js')
const { findSteam } = require('../logic/pathFinder.js')
const { STEAM_APP_ID } = require('../constants.js')

ipcMain.on('get-remote', async ({ sender }) => {
  const window = BrowserWindow.fromWebContents(sender)
  window.setProgressBar(1, { mode: 'indeterminate' })

  try {
    const [mods, gameVersions] = await Promise.all([
      fetchMods('newest-by-gameversion'),
      fetchGameVersions(),
    ])

    const manifestTest = await findSteam(STEAM_APP_ID)
    if (manifestTest.found) {
      const idx = gameVersions.findIndex(x => x.manifest === manifestTest.manifest)
      if (idx > 0) gameVersions[idx].selected = true
      else gameVersions[0].selected = true
    } else {
      gameVersions[0].selected = true
    }

    window.setProgressBar(0, { mode: 'none' })
    sender.send('set-remote', { status: 'success', mods, gameVersions })
  } catch (err) {
    log.error(err)

    sender.send('set-remote', { status: 'error', statusText: err.message })
    window.setProgressBar(1, { mode: 'error' })
  }
})
