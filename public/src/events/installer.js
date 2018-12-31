const { ipcMain } = require('electron')
const { installMods } = require('../jobs/installer.js')
const { patchGame } = require('../jobs/patch.js')
const { enqueueJob, dequeueJob } = require('../utils/queue.js')
const { runJob } = require('../jobs/job.js')

ipcMain.on('install-mods', async ({ sender }, data) => {
  // Wrap the whole thing in a job
  const jobID = await enqueueJob()

  // Install mods
  const installJob = installMods(data.mods, data.install, data.gameVersion)
  const installSuccess = await runJob(installJob)
  if (!installSuccess) return dequeueJob(jobID)

  // Patch game
  const patchJob = patchGame(data.install)
  const patchSuccess = await runJob(patchJob)
  if (!patchSuccess) return dequeueJob(jobID)

  // Release job queue
  sender.send('set-status', { text: 'Install complete!' })
  return dequeueJob(jobID)
})

ipcMain.on('patch-game', async (_, install) => {
  // Patch game
  const patchJob = patchGame(install)
  await runJob(patchJob)
})
