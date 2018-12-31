const { clipboard, shell } = require('electron')
const log = require('electron-log')
const { JobError } = require('./job.js')
const { generate: genDiagnostics } = require('../logic/diagnostics.js')
const { findPath } = require('../logic/pathFinder.js')
const { uploadPaste } = require('../remote/paste.js')
const { getActiveWindow } = require('../utils/window.js')
const { ERRORS } = require('../constants.js')

class DiagnosticsError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Diagnostics Error'
  }
}

const runDiagnostics = async win => {
  // Window Details
  const { sender } = getActiveWindow(win)

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new DiagnosticsError(ERRORS.INVALID_INSTALL_DIR)

  // Send starting message
  sender.send('set-status', { text: 'Running diagnostics...' })

  try {
    // Generate diagnostics report
    const diagnostics = await genDiagnostics(install.path)
    if (diagnostics.length > 400000) throw new DiagnosticsError(ERRORS.DIAGNOSTICS_TOO_LARGE)

    // Upload to hastebin
    const url = await uploadPaste(diagnostics, 'txt')

    // Open url and save to clipboard
    clipboard.writeText(url)
    shell.openExternal(url)

    // Write final status
    sender.send('set-status', { text: 'Diagnostics uploaded, copied URL to clipboard!' })
  } catch (err) {
    log.error(err)
    throw new DiagnosticsError(ERRORS.DIAGNOSTICS_FAILURE)
  }
}

module.exports = { runDiagnostics }
