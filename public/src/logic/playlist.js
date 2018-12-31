const path = require('path')
const fse = require('../utils/file.js')
const { runJob } = require('../jobs/job.js')
const { beatSaverBeatmap } = require('../jobs/beatmap.js')
const { getActiveWindow } = require('../utils/window.js')

/**
 * @typedef {Object} Playlist
 * @property {string} fileName
 * @property {string} title
 * @property {string} archiveUrl
 * @property {string} raw
 * @property {{ songName: string, key: string }[]} songs
 */

/**
 * @param {string} fileName File Name
 * @param {any} json Raw Playlist JSON
 * @returns {{ playlist: Playlist, error: Error }}
 */
const resolvePlaylist = (fileName, json) => {
  const { name } = path.parse(decodeURIComponent(fileName))

  // Validate JSON
  const error = new Error('Invalid Playlist')
  if (!json.playlistTitle) return { playlist: undefined, error }
  if (!json.songs) return { playlist: undefined, error }

  // Return
  const playlist = {
    fileName: `${name}.bplist`,
    title: json.playlistTitle,
    archiveUrl: json.customArchiveUrl,
    raw: JSON.stringify(json),
    songs: json.songs,
  }
  return { playlist, error: undefined }
}

/**
 * @param {Playlist} playlist Playlist
 * @param {string} installDir Install Dir
 * @returns {Promise.<void>}
 */
const installPlaylist = async (playlist, installDir) => {
  // Window Details
  const { sender } = getActiveWindow()

  // Ensure CustomSongs and Playlists exists
  const customSongs = path.join(installDir, 'CustomSongs')
  await fse.ensureDir(customSongs)
  await fse.ensureDir(path.join(installDir, 'Playlists'))

  // Writing playlist to file
  sender.send('set-status', { text: 'Saving playlist info...' })
  fse.writeFile(path.join(installDir, 'Playlists', playlist.fileName), playlist.raw)

  // Start jobs for every song
  const jobs = playlist.songs.map(({ key }) => {
    const job = beatSaverBeatmap(key)
    return runJob(job)
  })
  await Promise.all(jobs)

  // Send status and return
  sender.send('set-status', { text: 'Playlist downloaded!' })
  return undefined
}

module.exports = { resolvePlaylist, installPlaylist }
