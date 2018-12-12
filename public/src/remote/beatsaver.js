const { get } = require('snekfetch')

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
 * @returns {Promise.<Song>}
 */
const fromID = async id => (await get(`https://beatsaver.com/api/songs/detail/${id}`)).body.song

/**
 * @param {string} hash Song Hash
 * @returns {Promise.<Song>}
 */
const fromHash = async hash => (await get(`https://beatsaver.com/api/songs/search/hash/${hash}`)).body.songs[0]

module.exports = { inputType, fromID, fromHash }
