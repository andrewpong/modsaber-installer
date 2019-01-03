const path = require('path')
const log = require('electron-log')
const fileType = require('file-type')
const fse = require('../utils/file.js')
const { JobError } = require('./job.js')
const { findPath } = require('../logic/pathFinder.js')
const { saveBeatmap } = require('../logic/beatmap.js')
const { safeDownload } = require('../remote/remote.js')
const { inputType, fromHash, fromID } = require('../remote/beatsaver.js')
const { getActiveWindow } = require('../utils/window.js')
const { ERRORS } = require('../constants.js')

class BeatmapError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Beatmap Install Error'
  }
}

/**
 * @param {string} input BeatSaver Key
 * @returns {Promise.<void>}
 */
const beatSaverBeatmap = async input => {
  // Window Details
  const { sender } = getActiveWindow()

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new BeatmapError(ERRORS.INVALID_INSTALL_DIR)

  // Validate input type
  const type = inputType(input)
  if (type === 'invalid') throw new BeatmapError('Invalid Song ID / Hash!')

  // Download song info
  sender.send('set-status', { text: 'Downloading song info...' })
  const { error, song } = await (type === 'hash' ? fromHash(input) : fromID(input))
  if (error) throw new BeatmapError(`Song Not Found!\nFailed to find "${input}"`)

  // Download song zip
  sender.send('set-status', { text: 'Downloading song zip...' })
  const zip = await safeDownload(song.downloadUrl, true)
  if (zip.error) {
    log.error(zip.error)
    throw new BeatmapError('Song Download Failed!')
  }

  try {
    await saveBeatmap(zip.body, song.key, install.path)
    return undefined
  } catch (err) {
    log.error(err)
    throw new BeatmapError('Extraction Failure!')
  }
}

/**
 * @param {string} filePath File Path
 * @returns {Promise.<void>}
 */
const fileBeatmap = async filePath => {
  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new BeatmapError(ERRORS.INVALID_INSTALL_DIR)

  // Parse file info
  const { base, name } = path.parse(filePath)

  // Validate file exists
  const fileExists = await fse.exists(filePath)
  if (!fileExists) throw new BeatmapError(`Could not find file ${base}!`)

  // Read and validate file
  const zip = await fse.readFile(filePath)
  const { mime } = fileType(zip)
  if (mime !== 'application/zip') throw new BeatmapError('File is not a Beatmap zip!')

  // Delete and install
  await fse.remove(filePath)
  await saveBeatmap(zip, name, install.path)
  return undefined
}

module.exports = { beatSaverBeatmap, fileBeatmap }
