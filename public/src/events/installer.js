const { ipcMain, dialog, BrowserWindow } = require('electron')
const log = require('electron-log')
const { getAttention } = require('../utils/window.js')
const { InstallerError, installMods } = require('../jobs/installer.js')
const { enqueueJob, dequeueJob } = require('../logic/queue.js')

ipcMain.on('install-mods', async ({ sender }, data) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  // Start job
  const jobID = await enqueueJob()
  window.setProgressBar(1, { mode: 'indeterminate' })

  try {
    await installMods(data.mods, data.install, data.gameVersion, window)
    window.setProgressBar(1, { mode: 'normal' })
  } catch (err) {
    if (err instanceof InstallerError) {
      log.debug(err)
      window.setProgressBar(1, { mode: 'error' })

      if (err.flash) getAttention(window)
      if (err.status) sender.send('set-status', { text: err.status })

      dialog.showMessageBox(window, {
        type: 'error',
        title: err.title,
        message: err.message,
      })
    }
  }

  // Reset progress bar
  setTimeout(() => {
    window.setProgressBar(0, { mode: 'none' })
  }, 500)

  // Dequeue job
  await dequeueJob(jobID)
})
