const { safeDownload } = require('./remote.js')

const inputType = input => {
  const idRx = /^[0-9]{1,5}(?:-[0-9]{1,5})?$/g
  const hashRx = /^[a-f0-9]{32}$/i

  return idRx.test(input) ?
    'id' :
    hashRx.test(input) ?
      'hash' :
      'invalid'
}

/**
 * @typedef {Object} Song
 * @property {string} key
 * @property {string} name
 * @property {string} description
 * @property {string} uploader
 * @property {string} songName
 * @property {string} songSubName
 * @property {string} authorName
 * @property {string} downloadUrl
 * @property {string} hashMd5
 */

/**
 * @param {string} id Song ID
 * @returns {Promise.<{ error: boolean, song: Song }>}
 */
const fromID = async id => {
  const { error, body } = await safeDownload(`https://beatsaver.com/api/songs/detail/${id}`)

  if (error) return { error: true, song: null }
  else return { error: false, song: body.song }
}

/**
 * @param {string} hash Song Hash
 * @returns {Promise.<{ error: boolean, song: Song }>}
 */
const fromHash = async hash => {
  const { error, body } = await safeDownload(`https://beatsaver.com/api/songs/search/hash/${hash}`)

  if (error) return { error: true, song: null }
  else return { error: false, song: body.songs[0] }
}

module.exports = { inputType, fromID, fromHash }
