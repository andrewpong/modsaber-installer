const { post } = require('snekfetch')
const { USER_AGENT, HASTE_URL } = require('../constants.js')

/**
 * Upload text to a Hastebin compatible clone
 * @param {string} body Paste Body
 * @param {string} [ext] File Extension
 * @returns {Promise.<string>}
 */
const uploadPaste = async (body, ext) => {
  const { body: { key } } = await post(`${HASTE_URL}/documents`)
    .set('User-Agent', USER_AGENT)
    .send(body)

  return `${HASTE_URL}/${key}${ext !== undefined ? `.${ext}` : ''}`
}

module.exports = { uploadPaste }
