const { ipcMain } = require('electron')
const { fetchMods, fetchGameVersions } = require('../logic/modsaber.js')

ipcMain.on('get-remote', async ({ sender }) => {
  try {
    const [mods, gameVersions] = await Promise.all([
      fetchMods(),
      fetchGameVersions(),
    ])

    sender.send('set-remote', { status: 'success', mods, gameVersions })
  } catch (err) {
    sender.send('set-remote', { status: 'error' })
  }
})
