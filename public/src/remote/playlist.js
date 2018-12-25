const { get } = require('snekfetch')
const { USER_AGENT } = require('../constants.js')

/**
 * @typedef {Object} Playlist
 * @property {string} playlistTitle
 * @property {string} customArchiveUrl
 * @property {{ songName: string, key: string }[]} songs
 */

/**
 * @param {string} url Playlist URL
 * @returns {Promise.<Playlist>}
 */
const fetchPlaylist = async url => {
  const { body } = await get(url).set('User-Agent', USER_AGENT)

  return {
    playlistTitle: body.playlistTitle,
    customArchiveUrl: body.customArchiveUrl,
    songs: body.songs,
  }
}

module.exports = { fetchPlaylist }
