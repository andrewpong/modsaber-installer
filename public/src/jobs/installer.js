const path = require('path')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const { BrowserWindow } = require('electron')
const Store = require('electron-store')
const log = require('electron-log')
const { JobError } = require('./job.js')
const fse = require('../utils/file.js')
const { promiseHandler } = require('../utils/helpers.js')
const { downloadMod } = require('../remote/modsaber.js')
const { BEAT_SABER_EXE, IPA_EXE, BPM_EXE } = require('../constants.js')
const store = new Store()

class InstallError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Install Error'
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
  if (install.platform === 'unknown' || !install.valid) throw new InstallError('Invalid install path!', 'Invalid install path!')

  // Save install path
  store.set('install', install)

  // Ensure some required folders exist
  await fse.ensureDir(path.join(install.path, 'UserData'))
  await fse.ensureDir(path.join(install.path, 'Playlists'))

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

  // Move incompatible plugins
  const moveAndWrite = async (version = 'Unknown') => {
    // Send status
    sender.send('set-status', { text: 'Moving incompatible plugins...' })

    // Write new txt value
    await fse.writeFile(versionTxt, gameVersion.value)

    // Reference directories
    const pluginsDir = path.join(install.path, 'Plugins')
    const incompatibleDir = path.join(install.path, 'Incompatible Plugins', `Plugins v${version}`)

    // Clean new directory
    try {
      await fse.rmDir(incompatibleDir)
    } catch (err) {
      // Ignore errors
    }

    // Create directories
    await fse.ensureDir(path.join(install.path, 'Incompatible Plugins'))
    await fse.ensureDir(incompatibleDir)

    // Move old files
    const oldFiles = await fse.glob(path.join(pluginsDir, '**', '*'))
    await Promise.all(oldFiles.map(oldPath => {
      const newPath = path.join(incompatibleDir, oldPath.replace(pluginsDir.replace(/\\/g, '/'), ''))
      return fse.rename(oldPath, newPath)
    }))

    try {
      await fse.rmDir(pluginsDir)
      return undefined
    } catch (err) {
      // Ignore errors
      return undefined
    }
  }

  // Validate Beat Saber version
  const versionTxt = path.join(install.path, 'BeatSaberVersion.txt')
  const versionTxtExists = await fse.exists(versionTxt)
  if (!versionTxtExists) {
    await moveAndWrite()
  } else {
    const versionTxtValue = await fse.readFile(versionTxt, 'utf8')
    if (versionTxtValue !== gameVersion.value) await moveAndWrite(versionTxtValue)
  }

  // Send status
  sender.send('set-status', { text: 'Downloading mods...' })

  // Download Mods
  const downloadJobs = Promise.all(mods.map(mod => downloadMod(mod, install.platform, install.path)))
  const { error: dlError, result: downloaded } = await promiseHandler(downloadJobs)

  // Handle download errors
  if (dlError) {
    const err = new InstallError(
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

  // Check if IPA exists
  const canPatch = await fse.exists(exePath) && await fse.exists(ipaPath)
  if (!canPatch) {
    const err = new InstallError('Could not patch Beat Saber! (IPA Missing)', 'IPA Error!', 'IPA Error')

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

    const err = new InstallError('Could not patch Beat Saber! (IPA Error)\nStack trace written to log file.', 'IPA Error!', 'IPA Error')
    err.flash = true
    throw err
  }
}

module.exports = { InstallError, installMods }
