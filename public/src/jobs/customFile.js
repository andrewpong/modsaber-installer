const path = require('path')
const { parse: parseURL } = require('url')
const fileType = require('file-type')
const { BrowserWindow } = require('electron')
const fse = require('../utils/file.js')
const { safeDownload } = require('../remote/remote.js')
const { JobError } = require('./job.js')
const { findPath } = require('../logic/pathFinder.js')
const { installSong } = require('../logic/songInstall.js')
const { CUSTOM_FILE_DIRS } = require('../constants.js')

class CustomFileError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'File Install Error'
  }
}

class BeatmapError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Beatmap Install Error'
  }
}

/**
 * @param {string} filePath File Path
 * @param {BrowserWindow} win Browser Window
 * @param {boolean} [remote] Whether this is a remote path
 * @returns {Promise.<void>}
 */
const handleCustomFile = async (filePath, win, remote = false) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new CustomFileError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Parse file path
  const parsed = path.parse(filePath)
  const dir = CUSTOM_FILE_DIRS[parsed.ext]
  if (dir === undefined) throw new CustomFileError(`File extension ${parsed.ext} not supported.`)
  const fullDir = path.join(install.path, dir)

  // Throw error if file is already installed
  if (fullDir === parsed.dir) throw new CustomFileError(`${parsed.base} is already installed!`)

  // Create the directory if it doesn't exist
  await fse.ensureDir(fullDir)

  // Move / save file
  const newPath = path.join(fullDir, decodeURIComponent(parsed.base))
  if (remote) {
    // Validate
    const { hostname } = parseURL(filePath)
    if (hostname !== 'modelsaber.assistant.moe') throw new CustomFileError('oh no')

    // Download
    const download = await safeDownload(filePath)
    if (download.error) throw new CustomFileError('File download failed!\nCheck your internet and try again.')

    // Save file
    await fse.writeFile(newPath, download.body)
  } else {
    await fse.copyFile(filePath, newPath)
    await fse.remove(filePath)
  }

  // Set status
  sender.send('set-status', { text: `Installed ${parsed.base} successfully!` })
  return undefined
}

/**
 * @param {string} filePath File Path
 * @param {BrowserWindow} win Browser Window
 */
const handleBeatmap = async (filePath, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new BeatmapError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Parse file path
  const parsed = path.parse(filePath)

  // Read and validate file
  const zip = await fse.readFile(filePath)
  const { mime } = fileType(zip)
  if (mime !== 'application/zip') throw new BeatmapError('File is not a Beatmap zip!')

  // Delete and install
  await fse.remove(filePath)
  await installSong(zip, parsed.name, install.path, window)
  return undefined
}

module.exports = { handleCustomFile, handleBeatmap }
