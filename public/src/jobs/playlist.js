const path = require('path')
const { parse: parseURL } = require('url')
const { BrowserWindow } = require('electron')
const fse = require('../utils/file.js')
const { JobError, runJob } = require('./job.js')
const { downloadSong } = require('./beatsaver.js')
const { findPath } = require('../logic/pathFinder.js')
const { fetchPlaylist } = require('../remote/playlist.js')

class PlaylistError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'Playlist Download Error'
  }
}

/**
 * @param {string} url Playlist URL
 * @param {BrowserWindow} win Browser Window
 */
const downloadPlaylist = async (url, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new PlaylistError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Ensure CustomSongs and Playlists exists
  const customSongs = path.join(install.path, 'CustomSongs')
  await fse.ensureDir(customSongs)
  await fse.ensureDir(path.join(install.path, 'Playlists'))

  // Download playlist info
  sender.send('set-status', { text: 'Downloading playlist info...' })
  const { playlist, error } = await fetchPlaylist(url)
  if (error) throw new PlaylistError('Playlist info could not be downloaded!\nDouble check the URL exists and is valid.')

  // Ensure we don't download from untrusted sources
  if (playlist.customArchiveUrl) {
    const { hostname } = parseURL(playlist.customArchiveUrl)
    if (hostname !== 'beatsaver.com') throw new PlaylistError('For security reasons we do not allow playlists with custom archive URLs!')
  }

  // Writing playlist to file
  sender.send('set-status', { text: 'Saving playlist info...' })
  fse.writeFile(path.join(install.path, 'Playlists', playlist.fileName), playlist.raw)

  // Start jobs for every song
  const jobs = playlist.songs.map(({ key }) => {
    const job = downloadSong(key, window)
    return runJob(job, window)
  })
  await Promise.all(jobs)

  sender.send('set-status', { text: 'Playlist downloaded!' })
  return undefined
}

module.exports = { downloadPlaylist }
