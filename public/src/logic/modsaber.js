const { get } = require('snekfetch')
const { API_URL } = require('../constants.js')

/**
 * @param {('latest'|'all')} options Mod Fetch Options
 * @returns {Promise.<any[]>}
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

module.exports = { fetchMods, fetchGameVersions }
