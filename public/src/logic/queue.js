const uuid = require('uuid/v4')
const { BrowserWindow, ipcMain } = require('electron')

/**
 * @param {('enqueue'|'dequeue')} task Task Type
 * @param {string} [id] Job ID
 * @returns {Promise.<string>}
 */
const manageJob = (task, id) => new Promise((resolve, reject) => {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) return reject(new Error('Window not found'))

  const noonce = uuid()
  win.webContents.send('queue-job', { noonce, task, id })

  ipcMain.on('queue-job-resp', (_, resp) => {
    if (resp.noonce !== noonce) return undefined
    resolve(resp.id)
  })
})

/**
 * @param {string} [id] Job ID
 * @returns {Promise.<string>}
 */
const enqueueJob = id => manageJob('enqueue', id)

/**
 * @param {string} id Job ID
 * @returns {Promise.<string>}
 */
const dequeueJob = id => manageJob('dequeue', id)

module.exports = { enqueueJob, dequeueJob }
