const { BrowserWindow, clipboard, shell } = require('electron')
const log = require('electron-log')
const { JobError } = require('./job.js')
const { generate: genDiagnostics } = require('../logic/diagnostics.js')
const { findPath } = require('../logic/pathFinder.js')
const { uploadPaste } = require('../remote/paste.js')

class DiagnosticsError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Diagnostics Error'
  }
}

const runDiagnostics = async win => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new DiagnosticsError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Send starting message
  sender.send('set-status', { text: 'Running diagnostics...' })

  try {
    // Generate diagnostics report
    const diagnostics = await genDiagnostics(install.path)
    const url = await uploadPaste(diagnostics, 'txt')

    // Open url and save to clipboard
    clipboard.writeText(url)
    shell.openExternal(url)

    // Write final status
    sender.send('set-status', { text: 'Diagnostics uploaded, copied URL to clipboard!' })
  } catch (err) {
    log.error(err)
    throw new DiagnosticsError('Failed to run diagnostics!\nError written to log file.')
  }
}

module.exports = { runDiagnostics }
