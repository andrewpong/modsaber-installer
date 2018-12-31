const { dialog } = require('electron')
const log = require('electron-log')
const { getAttention } = require('../utils/window.js')
const { enqueueJob, dequeueJob } = require('../utils/queue.js')
const { getActiveWindow } = require('../utils/window.js')

class JobError extends Error {
  /**
   * @param {string} message Error Message
   * @param {string} [status] IPC Status
   * @param {string} [title] Dialog Title
   */
  constructor (message, status, title) {
    super(message)

    this.title = title || 'Job Error'
    this.status = status

    this.flash = false
  }
}

/**
 * @template T
 * @param {Promise.<T>} job Job
 * @returns {Promise.<boolean>}
 */
const runJob = async job => {
  // Window Details
  const { window, sender } = getActiveWindow()

  // Start job
  const jobID = await enqueueJob()
  window.setProgressBar(1, { mode: 'indeterminate' })

  // Track errors
  let error = false

  try {
    await job
    window.setProgressBar(1, { mode: 'normal' })
  } catch (err) {
    if (err instanceof JobError) {
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

    error = true
  }

  // Reset progress bar
  setTimeout(() => {
    window.setProgressBar(0, { mode: 'none' })
  }, 500)

  // Dequeue job
  await dequeueJob(jobID)
  return !error
}

module.exports = { JobError, runJob }
