const fetch = require('node-fetch')
const { USER_AGENT, HASTE_URL } = require('../constants.js')

/**
 * Upload text to a Hastebin compatible clone
 * @param {string} body Paste Body
 * @param {string} [ext] File Extension
 * @returns {Promise.<string>}
 */
const uploadPaste = async (body, ext) => {
  const resp = await fetch(`${HASTE_URL}/documents`, {
    method: 'post',
    headers: { 'User-Agent': USER_AGENT },
    body,
  })

  const { key } = await resp.json()
  return `${HASTE_URL}/${key}${ext !== undefined ? `.${ext}` : ''}`
}

module.exports = { uploadPaste }
