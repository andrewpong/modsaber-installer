const log = require('electron-log')
const { get } = require('snekfetch')
const { extractZip, safeDownload } = require('./remote.js')
const { calculateHash } = require('../utils/helpers.js')
const { API_URL, USER_AGENT, BLOCKED_EXTENSIONS } = require('../constants.js')

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

  const { body: { lastPage } } = await get(`${API_URL}/mods/approved/${type}`).set('User-Agent', USER_AGENT)
  const pages = Array.from(new Array(lastPage + 1)).map((_, i) => i)

  const multi = await Promise.all(pages.map(async page => {
    const { body: { mods } } = await get(`${API_URL}/mods/approved/${type}/${page}`).set('User-Agent', USER_AGENT)
    return mods
  }))

  return [].concat(...multi)
}

/**
 * @returns {Promise.<{ id: string, value: string, manifest: string }[]>}
 */
const fetchGameVersions = async () => {
  const { body } = await get(`${API_URL}/site/gameversions`).set('User-Agent', USER_AGENT)
  return body
}

class DownloadError extends Error {
  /**
   * @param {string} message Error Message
   * @param {Mod} mod Mod
   */
  constructor (message, mod) {
    super(message)
    this.mod = mod
  }
}

/**
 * @param {Mod} mod Mod Data
 * @param {('steam'|'oculus')} platform Install Platform
 * @param {string} installDir Install Directory
 * @returns {Promise.<{ path: string, data: Buffer }[]>}
 */
const downloadMod = async (mod, platform, installDir) => {
  const files = platform === 'steam' || mod.files.oculus === undefined ?
    mod.files.steam :
    mod.files.oculus

  // Download
  const resp = await safeDownload(files.url)
  if (resp.error) throw new DownloadError('Network Failure', mod)

  // Calculate Hash
  const hash = await calculateHash(resp.body)
  if (hash !== files.hash) throw new DownloadError('Download Hash Mismatch', mod)

  // Extract
  try {
    const extracted = await extractZip(resp.body, installDir, { filter: BLOCKED_EXTENSIONS, filterType: 'blacklist' })
    return extracted
  } catch (err) {
    log.error(err)
    throw new DownloadError('Extraction Failure', mod)
  }
}

module.exports = { fetchMods, fetchGameVersions, downloadMod }
