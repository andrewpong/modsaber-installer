const path = require('path')
const { BrowserWindow } = require('electron')
const log = require('electron-log')
const fse = require('../utils/file.js')
const { JobError } = require('./job.js')
const { findPath } = require('../logic/pathFinder.js')
const { extractZip, safeDownload } = require('../remote/remote.js')
const { inputType, fromHash, fromID } = require('../remote/beatsaver.js')

class BeatSaverError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Song Download Error'
  }
}

/**
 * @param {string} input BeatSaver Input (hash or key)
 * @param {BrowserWindow} win Browser Window
 */
const downloadSong = async (input, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new BeatSaverError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Ensure CustomSongs and Playlists exists
  const customSongs = path.join(install.path, 'CustomSongs')
  await fse.ensureDir(customSongs)
  await fse.ensureDir(path.join(install.path, 'Playlists'))

  // Validate input type
  const type = inputType(input)
  if (type === 'invalid') throw new BeatSaverError('Invalid Song ID / Hash!')

  // Download song info
  sender.send('set-status', { text: 'Downloading song info...' })
  const { error, song } = await (type === 'hash' ? fromHash(input) : fromID(input))
  if (error) throw new BeatSaverError('Song Not Found!')

  // Download song zip
  sender.send('set-status', { text: 'Downloading song zip...' })
  const zip = await safeDownload(song.downloadUrl)
  if (zip.error) throw new BeatSaverError('Song Download Failed!')

  try {
    // Extract zip
    sender.send('set-status', { text: 'Extracting song...' })
    const files = await extractZip(
      zip.body, path.join(customSongs, song.key),
      {
        filter: ['.json', '.ogg', '.wav', '.jpg', '.jpeg', '.png'],
        filterType: 'whitelist',
      }
    )

    // File Write Jobs
    const jobs = files.map(async file => {
      const { dir } = path.parse(file.path)

      if (dir.includes('autosaves')) return undefined
      await fse.ensureDir(dir)

      return fse.writeFile(file.path, file.data)
    })

    // Flush all jobs and return
    await Promise.all(jobs)
    sender.send('set-status', { text: 'Song install complete!' })
    return undefined
  } catch (err) {
    log.error(err)
    throw new BeatSaverError('Extraction Failure!')
  }
}

module.exports = { BeatSaverError, downloadSong }
