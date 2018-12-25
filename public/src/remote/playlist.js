const path = require('path')
const { safeDownload } = require('./remote.js')

/**
 * @typedef {Object} Playlist
 * @property {string} fileName
 * @property {string} playlistTitle
 * @property {string} customArchiveUrl
 * @property {string} raw
 * @property {{ songName: string, key: string }[]} songs
 */

/**
 * @param {string} url Playlist URL
 * @returns {Promise.<{ playlist: Playlist, error: boolean }>}
 */
const fetchPlaylist = async url => {
  const { body, error } = await safeDownload(url)
  const { base: fileName } = path.parse(url)

  return {
    error,
    playlist: {
      fileName: decodeURIComponent(fileName),
      playlistTitle: body.playlistTitle,
      customArchiveUrl: body.customArchiveUrl,
      raw: JSON.stringify(body),
      songs: body.songs,
    },
  }
}

module.exports = { fetchPlaylist }
