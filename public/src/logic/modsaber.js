const path = require('path')
const AdmZip = require('adm-zip')
const { get } = require('snekfetch')
const { calculateHash } = require('./helpers.js')
const { API_URL, USER_AGENT } = require('../constants.js')

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

/**
 * @param {string} url URL
 * @returns {Promise.<{ error: boolean, body: Buffer}>}
 */
const safeDownload = async url => {
  try {
    const resp = await get(url).set('User-Agent', USER_AGENT)

    if (resp.statusCode !== 200) throw new Error('Status not 200')
    else return { error: false, body: resp.body }
  } catch (err) {
    return { error: true, body: null }
  }
}

/**
 * @param {Buffer} blob Zip Blob
 * @param {string} installDir Install Directory
 * @returns {Promise.<{ path: string, data: Buffer }[]>}
 */
const extractZip = async (blob, installDir) => {
  const zip = new AdmZip(blob)

  const entries = zip.getEntries().map(entry => new Promise(resolve => {
    if (entry.isDirectory) resolve(null)

    // Filter out files that try to break out of the install dir
    const fullPath = path.join(installDir, entry.entryName)
    if (!fullPath.startsWith(installDir)) return resolve(null)

    entry.getDataAsync(data => resolve({ path: path.join(installDir, entry.entryName), data }))
  }))

  const data = await Promise.all(entries)
  return data.filter(x => x !== null)
}

class InstallError extends Error {
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
  const files = platform === 'oculus' ? mod.files.oculus : mod.files.steam

  // Download
  const resp = await safeDownload(files.url)
  if (resp.error) throw new InstallError('Network Failure', mod)

  // Calculate Hash
  const hash = await calculateHash(resp.body)
  if (hash !== files.hash) throw new InstallError('Download Hash Mismatch', mod)

  // Extract
  try {
    const extracted = await extractZip(resp.body, installDir)
    return extracted
  } catch (err) {
    throw new InstallError('Extraction Failure', mod)
  }
}

module.exports = { fetchMods, fetchGameVersions, downloadMod }
