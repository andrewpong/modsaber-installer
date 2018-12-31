const path = require('path')
const { parse: parseURL } = require('url')
const log = require('electron-log')
const fse = require('../utils/file.js')
const { JobError } = require('./job.js')
const { findPath } = require('../logic/pathFinder.js')
const { resolvePlaylist, installPlaylist } = require('../logic/playlist.js')
const { safeDownload } = require('../remote/remote.js')
const { getActiveWindow } = require('../utils/window.js')
const { ERRORS } = require('../constants.js')

class PlaylistError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Playlist Install Error'
  }
}

/**
 * @param {string} url URL
 * @returns {Promise.<void>}
 */
const remotePlaylist = async url => {
  // Window Details
  const { sender } = getActiveWindow()

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new PlaylistError(ERRORS.INVALID_INSTALL_DIR)

  // Download playlist info
  sender.send('set-status', { text: 'Downloading playlist info...' })
  const { body, error } = await safeDownload(url)
  if (error) {
    log.error(error)
    throw new PlaylistError('Playlist info could not be downloaded!\nDouble check the URL exists and is valid.')
  }

  // Resolve playlist
  const { base } = path.parse(url)
  const { playlist, error: plError } = resolvePlaylist(base, body)
  if (plError) throw new PlaylistError('Invalid Playlist File!')

  // Check archive URL
  if (playlist.archiveUrl) {
    const { hostname } = parseURL(playlist.archiveUrl)
    if (hostname !== 'beatsaver.com') throw new PlaylistError('For security reasons we do not allow playlists with custom archive URLs!')
  }

  // Install playlist
  return installPlaylist(playlist, install.path)
}

/**
 * @param {string} filePath File Path
 * @returns {Promise.<void>}
 */
const localPlaylist = async filePath => {
  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new PlaylistError(ERRORS.INVALID_INSTALL_DIR)

  // Parse file info
  const { base } = path.parse(filePath)

  // Validate file exists
  const fileExists = await fse.exists(filePath)
  if (!fileExists) throw new PlaylistError(`Could not find file ${base}!`)

  // Read and validate file
  const raw = await fse.readFile(filePath, 'utf8')
  const body = JSON.parse(raw)
  const { playlist, error: plError } = resolvePlaylist(base, body)
  if (plError) throw new PlaylistError('Invalid Playlist File!')

  // Remove original file
  await fse.remove(filePath)

  // Install Playlist
  return installPlaylist(playlist, install.path)
}

module.exports = { remotePlaylist, localPlaylist }
