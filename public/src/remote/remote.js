const path = require('path')
const AdmZip = require('adm-zip')
const { get } = require('snekfetch')
const { USER_AGENT } = require('../constants.js')

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

module.exports = { safeDownload, extractZip }
