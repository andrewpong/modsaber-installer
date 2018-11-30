const { ipcMain } = require('electron')
const { fetchMods, fetchGameVersions } = require('../logic/modsaber.js')
const { findSteam } = require('../logic/pathFinder.js')
const { STEAM_APP_ID } = require('../constants.js')

ipcMain.on('get-remote', async ({ sender }) => {
  try {
    const [mods, gameVersions] = await Promise.all([
      fetchMods('all'),
      fetchGameVersions(),
    ])

    const manifestTest = await findSteam(STEAM_APP_ID)
    if (manifestTest) {
      const idx = gameVersions.findIndex(x => x.manifest === manifestTest.manifest)
      if (idx) gameVersions[idx].selected = true
      else gameVersions[0].selected = true
    } else {
      gameVersions[0].selected = true
    }

    sender.send('set-remote', { status: 'success', mods, gameVersions })
  } catch (err) {
    console.error(err)
    sender.send('set-remote', { status: 'error' })
  }
})
