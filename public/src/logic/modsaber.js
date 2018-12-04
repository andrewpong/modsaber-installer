const { get } = require('snekfetch')
const { calculateHash } = require('./hash.js')
const { API_URL } = require('../constants.js')

/**
 * @typedef {Object} Files
 * @property {string} url
 * @property {string} hash
 * @property {any} files
 */

/**
 * @typedef {Object} Mod
 * @property {string} name
 * @property {string} version
 * @property {object} files
 * @property {Files} files.steam
 * @property {Files} files.oculus
 */

/**
 * @param {('latest'|'all'|'newest-by-gameversion')} options Mod Fetch Options
 * @returns {Promise.<Mod[]>}
 */
const fetchMods = async options => {
  const type = options || 'latest'

  const { body: { lastPage } } = await get(`${API_URL}/mods/approved/${type}`)
  const pages = Array.from(new Array(lastPage + 1)).map((_, i) => i)

  const multi = await Promise.all(pages.map(async page => {
    const { body: { mods } } = await get(`${API_URL}/mods/approved/${type}/${page}`)
    return mods
  }))

  return [].concat(...multi)
}

/**
 * @returns {Promise.<{ id: string, value: string, manifest: string }[]>}
 */
const fetchGameVersions = async () => {
  const { body } = await get(`${API_URL}/site/gameversions`)
  return body
}

/**
 * @param {Mod} mod Mod Data
 * @param {('steam'|'oculus')} platform Install Platform
 * @returns {Promise.<{ mod: Mod, valid: boolean, data: Buffer, error: string }>}
 */
const downloadMod = async (mod, platform) => {
  try {
    const files = platform === 'oculus' ? mod.files.oculus : mod.files.steam
    const { body } = await get(files.url)

    const hash = await calculateHash(body)
    if (hash !== files.hash) return { mod, valid: false, data: null, error: 'Download Hash Mismatch' }

    return { mod, valid: true, data: body }
  } catch (err) {
    return { mod, valid: false, data: null, error: 'Network Error' }
  }
}

module.exports = { fetchMods, fetchGameVersions, downloadMod }
