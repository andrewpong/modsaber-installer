const { ipcMain, BrowserWindow } = require('electron')
const { installMods } = require('../jobs/installer.js')
const { runJob } = require('../jobs/job.js')

ipcMain.on('install-mods', async ({ sender }, data) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  const job = installMods(data.mods, data.install, data.gameVersion, window)
  await runJob(job, window)
})
