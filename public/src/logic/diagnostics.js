const path = require('path')
const { promisify } = require('util')
const treeify = require('treeify')
const glob = promisify(require('glob'))
const { calculateHash } = require('../utils/helpers.js')
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

/**
 * @param {string} dir Directory to list
 * @param {string[]} [filter] File Name Whitelist
 */
const getFiles = async (dir, filter) => {
  const globPath = path.join(dir, '**', '*.*')
  const files = await glob(globPath)

  const mapped = await Promise.all(files.map(async file => {
    const { base } = path.parse(file)
    if (filter !== undefined && !filter.includes(base)) return undefined

    const data = await fse.readFile(file)
    const hash = await calculateHash(data)

    const normalisedDir = dir.replace(/\\/g, '/')
    const normalised = file.replace(`${normalisedDir}/`, '')

    return { file: normalised, hash }
  }))

  const final = {}
  for (const { file, hash } of mapped.filter(x => x !== undefined)) {
    const fileParts = file.split('/')
    let prev = final

    for (const idx in fileParts) {
      const i = parseInt(idx, 10)
      const part = fileParts[i]
      const last = i === fileParts.length - 1

      if (last) {
        prev[part] = hash
        break
      }

      if (prev[part] === undefined) prev[part] = {}
      prev = prev[part]
    }
  }

  return final
}

const generate = async dir => {
  const version = await getVersion(dir)
  return render(version, {})
}

module.exports = { generate }
