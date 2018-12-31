const path = require('path')
const { promisify } = require('util')
const log = require('electron-log')
const exec = promisify(require('child_process').exec)
const { JobError } = require('./job.js')
const { beatSaberOpen } = require('../utils/process.js')
const fse = require('../utils/file.js')
const { getActiveWindow } = require('../utils/window.js')
const { BEAT_SABER_EXE, IPA_EXE, BPM_EXE } = require('../constants.js')

class PatchError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'IPA Error'
  }
}

/**
 * @param {{ path: string, valid: boolean, platform: ('steam'|'oculus'|'unknown') }} install Install Details
 */
const patchGame = async install => {
  // Window Details
  const { sender } = getActiveWindow()

  // Validate install details
  if (install.platform === 'unknown' || !install.valid) throw new PatchError('Invalid install path!', 'Invalid install path!')

  // Ensure Beat Saber is not open
  const isOpen = await beatSaberOpen()
  if (isOpen) throw new PatchError('Please close Beat Saber before patching!')

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
    sender.send('set-status', { text: 'Patch complete!' })

    return undefined
  } catch (error) {
    log.error(error)

    const err = new PatchError('Could not patch Beat Saber! (IPA Error)\nStack trace written to log file.', 'IPA Error!')
    err.flash = true
    throw err
  }
}

module.exports = { PatchError, patchGame }
