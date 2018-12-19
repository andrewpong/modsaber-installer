const uuid = require('uuid/v4')
const { BrowserWindow, ipcMain } = require('electron')

/**
 * @param {('enqueue'|'dequeue')} task Task Type
 * @param {string} [id] Job ID
 * @returns {Promise.<string>}
 */
const manageJob = (task, id) => new Promise((resolve, reject) => {
  const window = BrowserWindow.getAllWindows()[0]
  if (!window) return reject(new Error('Window not found'))

  const noonce = uuid()
  window.webContents.send('queue-job', { noonce, task, id })

  const respListener = (_, resp) => {
    if (resp.noonce !== noonce) return undefined

    ipcMain.removeListener('queue-job-resp', respListener)
    return resolve(resp.id)
  }

  return ipcMain.on('queue-job-resp', respListener)
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
