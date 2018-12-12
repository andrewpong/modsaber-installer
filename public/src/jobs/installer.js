const path = require('path')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { BrowserWindow } = require('electron')
const Store = require('electron-store')
const log = require('electron-log')
const fse = require('../utils/file.js')
const { promiseHandler } = require('../utils/helpers.js')
const { downloadMod } = require('../remote/modsaber.js')
const { BEAT_SABER_EXE, IPA_EXE } = require('../constants.js')
const store = new Store()

class InstallerError extends Error {
  /**
   * @param {string} message Error Message
   * @param {string} [status] IPC Status
   * @param {string} [title] Dialog Title
   */
  constructor (message, status, title) {
    super(message)

    this.title = title || 'Install Error'
    this.status = status

    this.flash = false
  }
}

/**
 * @param {any[]} mods Mods to Install
 * @param {{ path: string, valid: boolean, platform: ('steam'|'oculus'|'unknown') }} install Install Details
 * @param {{ id: string, manifest: string, value: string }} gameVersion Game Version
 * @param {BrowserWindow} win Browser Window
 */
const installMods = async (mods, install, gameVersion, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Validate install details
  if (install.platform === 'unknown' || !install.valid) throw new InstallerError('Invalid install path!', 'Invalid install path!')

  // Save install path
  store.set('install', install)

  // Ensure UserData directory exists
  await fse.ensureDir(path.join(install.path, 'UserData'))

  // Ensure BeatSaberVersion.txt exists
  const versionTxt = path.join(install.path, 'BeatSaberVersion.txt')
  const versionTxtExists = await fse.exists(versionTxt)
  if (!versionTxtExists) await fse.writeFile(versionTxt, gameVersion.value)

  // Send status
  sender.send('set-status', { text: 'Downloading mods...' })

  // Download Mods
  const downloadJobs = Promise.all(mods.map(mod => downloadMod(mod, install.platform, install.path)))
  const { error: dlError, result: downloaded } = await promiseHandler(downloadJobs)

  // Handle download errors
  if (dlError) {
    const err = new InstallerError(
      `Download failed for ${dlError.mod.name}@${dlError.mod.version}\nError: ${dlError.message}`,
      dlError.message,
      'Download Error'
    )

    err.flash = true
    throw err
  }

  // Write Mods
  for (const idx in downloaded) {
    const mod = mods[idx]
    const modFiles = downloaded[idx]

    sender.send('set-status', { text: `Writing ${mod.name}@${mod.version}` })
    const jobs = modFiles.map(async file => {
      const { dir } = path.parse(file.path)
      await fse.ensureDir(dir)

      return fse.writeFile(file.path, file.data)
    })

    await Promise.all(jobs) // eslint-disable-line
  }

  // IPA Paths
  const exePath = path.join(install.path, BEAT_SABER_EXE)
  const ipaPath = path.join(install.path, IPA_EXE)

  // Check if IPA exists
  const canPatch = await fse.exists(exePath) && await fse.exists(ipaPath)
  if (!canPatch) {
    const err = new InstallerError('Could not patch Beat Saber! (IPA Missing)', 'IPA Error!', 'IPA Error')

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

    const err = new InstallerError('Could not patch Beat Saber! (IPA Error)\nStack trace written to log file.', 'IPA Error!', 'IPA Error')
    err.flash = true
    throw err
  }
}

module.exports = { InstallerError, installMods }
