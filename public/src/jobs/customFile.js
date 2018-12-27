const path = require('path')
const { BrowserWindow } = require('electron')
const fse = require('../utils/file.js')
const { findPath } = require('../logic/pathFinder.js')
const { JobError } = require('./job.js')

class CustomFileError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'File Install Error'
  }
}

/**
 * @param {string} filePath File Path
 * @param {BrowserWindow} win Browser Window
 */
const handleCustomFile = async (filePath, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new CustomFileError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Parse file path
  const parsed = path.parse(filePath)

  const dir = parsed.ext === '.avatar' ?
    'CustomAvatars' :
    parsed.ext === '.saber' ?
      'CustomSabers' :
      'CustomPlatforms'
  const fullDir = path.join(install.path, dir)

  // Throw error if file is already installed
  if (fullDir === parsed.dir) throw new CustomFileError(`${parsed.base} is already installed!`)

  // Create the directory if it doesn't exist
  await fse.ensureDir(fullDir)

  // Move file
  const newPath = path.join(fullDir, parsed.base)
  await fse.copyFile(filePath, newPath)
  await fse.remove(filePath)

  // Set status
  sender.send('set-status', { text: `Installed ${parsed.base} successfully!` })
  return undefined
}

module.exports = { handleCustomFile }
