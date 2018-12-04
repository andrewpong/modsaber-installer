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

/**
 * @template T
 * @param {Promise.<T>} promise Promise to Wrap
 * @returns {Promise.<{ error: (Error|boolean), result: T }>}
 */
const promiseHandler = async promise => {
  try {
    const result = await promise
    return { error: false, result }
  } catch (error) {
    return { error, result: undefined }
  }
}

module.exports = { calculateHash, promiseHandler }
