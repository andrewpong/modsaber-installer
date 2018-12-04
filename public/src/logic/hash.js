const crypto = require('crypto')

/**
 * Calculate the SHA-1 Hash of a File Buffer
 * @param {Buffer} data File Buffer
 * @returns {Promise.<string>}
 */
const calculateHash = data => new Promise(resolve => {
  const hash = crypto.createHash('sha1')
  hash.update(data)

  resolve(hash.digest('hex'))
})

module.exports = { calculateHash }
