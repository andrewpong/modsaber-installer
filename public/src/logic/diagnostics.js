const path = require('path')
const treeify = require('treeify')
const fse = require('../utils/file.js')

/**
 * @param {string} root Root Title
 * @param {Object} tree Tree Object
 * @returns {string}
 */
const render = (root, tree) => {
  const HASH_LEN = 40

  /**
   * @type {string[]}
   */
  const lines = []
  treeify.asLines(tree, true, true, line => lines.push(line))

  const withHashes = lines.map(line => {
    const [value, hash] = line.split(': ')
    if (!hash) return { value, hash: '' }
    else return { value, hash }
  }).map(({ value, hash }) => `${hash.padEnd(HASH_LEN)} ${value}`)

  return [`${' '.repeat(HASH_LEN + 1)}${root}`, ...withHashes].join('\n')
}

const getVersion = async dir => {
  const txtPath = path.join(dir, 'BeatSaberVersion.txt')

  const exists = await fse.exists(txtPath)
  if (!exists) return 'Version Missing'

  const data = await fse.readFile(txtPath, 'utf8')
  return data
}

const generate = async dir => {
  const version = await getVersion(dir)
  return render(version, {})
}

module.exports = { generate }
