const { ipcMain, BrowserWindow } = require('electron')
const { installMods } = require('../jobs/installer.js')
const { patchGame } = require('../jobs/patch.js')
const { enqueueJob, dequeueJob } = require('../logic/queue.js')
const { runJob } = require('../jobs/job.js')

ipcMain.on('install-mods', async ({ sender }, data) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  // Wrap the whole thing in a job
  const jobID = await enqueueJob()

  // Install mods
  const installJob = installMods(data.mods, data.install, data.gameVersion, window)
  await runJob(installJob, window)

  // Patch game
  const patchJob = patchGame(data.install, window)
  await runJob(patchJob, window)

  // Release job queue
  sender.send('set-status', { text: 'Install complete!' })
  await dequeueJob(jobID)
})

ipcMain.on('patch-game', async ({ sender }, install) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  // Patch game
  const patchJob = patchGame(install, window)
  await runJob(patchJob, window)
})
