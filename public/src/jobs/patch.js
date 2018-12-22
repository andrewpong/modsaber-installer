const path = require('path')
const { promisify } = require('util')
const { BrowserWindow } = require('electron')
const log = require('electron-log')
const exec = promisify(require('child_process').exec)
const { JobError } = require('./job.js')
const fse = require('../utils/file.js')
const { BEAT_SABER_EXE, IPA_EXE, BPM_EXE } = require('../constants.js')

class PatchError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'IPA Error'
  }
}

/**
 * @param {{ path: string, valid: boolean, platform: ('steam'|'oculus'|'unknown') }} install Install Details
 * @param {BrowserWindow} win Browser Window
 */
const patchGame = async (install, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Validate install details
  if (install.platform === 'unknown' || !install.valid) throw new PatchError('Invalid install path!', 'Invalid install path!')

  // EXE Paths
  const exePath = path.join(install.path, BEAT_SABER_EXE)
  const ipaPath = path.join(install.path, IPA_EXE)
  const bpmPath = path.join(install.path, BPM_EXE)

  // Uninstall bpm if it exists
  const bpmInstalled = await fse.exists(bpmPath)
  if (bpmInstalled) {
    await fse.remove(exePath)
    await fse.rename(bpmPath, exePath)
  }

  // Check if IPA exists
  const canPatch = await fse.exists(exePath) && await fse.exists(ipaPath)
  if (!canPatch) {
    const err = new PatchError('Could not patch Beat Saber! (IPA Missing)', 'IPA Error!')

    err.flash = true
    throw err
  }

  sender.send('set-status', { text: 'Patching game...' })

  try {
    await exec(`"${ipaPath}" "${exePath}"`)
    sender.send('set-status', { text: 'Install complete!' })

    return undefined
  } catch (error) {
    log.error(error)

    const err = new PatchError('Could not patch Beat Saber! (IPA Error)\nStack trace written to log file.', 'IPA Error!')
    err.flash = true
    throw err
  }
}

module.exports = { PatchError, patchGame }
