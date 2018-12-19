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
 * @param {{ filter: string[], filterType: ('whitelist'|'blacklist') }} [options] File extension filter options
 * @returns {Promise.<{ path: string, data: Buffer }[]>}
 */
const extractZip = async (blob, installDir, options) => {
  const zip = new AdmZip(blob)

  const entries = zip.getEntries().map(entry => new Promise(resolve => {
    if (entry.isDirectory) return resolve(null)

    // Filter out files that try to break out of the install dir
    const fullPath = path.join(installDir, entry.entryName)
    if (!fullPath.startsWith(installDir)) return resolve(null)

    // Implement filter blacklist/whitelist
    if (options.filter) {
      const type = options.filterType || 'whitelist'
      const { ext } = path.parse(entry.entryName)

      const allowed = type === 'whitelist' ?
        options.filter.includes(ext) :
        !options.filter.includes(ext)

      if (!allowed) return resolve(null)
    }

    return entry.getDataAsync(data => resolve({ path: path.join(installDir, entry.entryName), data }))
  }))

  const data = await Promise.all(entries)
  return data.filter(x => x !== null)
}

module.exports = { safeDownload, extractZip }
