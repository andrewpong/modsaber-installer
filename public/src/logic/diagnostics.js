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

/**
 * @param {string} dir Game Directory
 */
const getVersion = async dir => {
  const txtPath = path.join(dir, 'BeatSaberVersion.txt')

  const exists = await fse.exists(txtPath)
  if (!exists) return 'Version Missing'

  const data = await fse.readFile(txtPath, 'utf8')
  return data
}

/**
 * @param {string} dir Directory
 * @returns {string}
 */
const normaliseDir = dir => `${dir.replace(/\\/g, '/')}/`

/**
 * @param {string} dir Directory to list
 * @param {Object} [options] Options
 * @param {boolean} [options.recursive] Search recursively
 * @param {string[]} [options.filter] File Name Whitelist
 * @param {boolean} [options.hashes] Include hashes
 */
const getFiles = async (dir, options = {}) => {
  const recursive = options.recursive !== undefined ? options.recursive : true
  const hashes = options.hashes !== undefined ? options.hashes : true

  const normalisedDir = normaliseDir(dir)
  const globPath = recursive ? path.join(dir, '**', '*.*') : path.join(dir, '*.*')
  const files = await glob(globPath)

  const mapped = await Promise.all(files.map(async file => {
    const isFile = await fse.isFile(file)
    if (!isFile) return undefined

    const { base } = path.parse(file)
    if (options.filter !== undefined && !options.filter.includes(base)) return undefined

    const data = await fse.readFile(file)
    const hash = hashes ? await calculateHash(data) : null

    const normalised = file.replace(normalisedDir, '')
    return { file: normalised, hash }
  }))

  return resolveFiles(mapped)
}

/**
 * @param {{ file: string, hash: string }} arr Input Array
 * @returns {Object}
 */
const resolveFiles = arr => {
  const final = {}
  for (const { file, hash } of arr.filter(x => x !== undefined)) {
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

/**
 * @typedef {{ name: string, body: string }} LogFile
 */

/**
 * @param {string} dir Directory to scan
 * @returns {Promise.<{ appData: LogFile[], root: LogFile[] }>}
 */
const getLogFiles = async dir => {
  const blacklist = [
    'Steamworks.NET.txt',
    'BeatSaberVersion.txt',
    'CustomMenuText.txt',
    'CustomFailText.txt',
  ]

  const logFiles = (await glob(path.join(dir, '**', '*.{txt,log}')))
    .filter(file => {
      if (file.includes('CustomSongs')) return false

      const { base } = path.parse(file)
      if (blacklist.includes(base)) return false

      return true
    })

  const appDataPath = path.resolve(`${process.env.APPDATA}\\..\\LocalLow\\Hyperbolic Magnetism\\Beat Saber`)
  const appDataFiles = await glob(path.join(appDataPath, '{output_log.txt,settings.cfg}'))

  /**
   * @param {string[]} files Files
   * @param {string} baseDir File Base Directory
   * @returns {Promise.<LogFile[]>}
   */
  const readAll = (files, baseDir) => Promise.all(files.map(async file => {
      const body = await fse.readFile(file, 'utf8')

      const normalisedDir = normaliseDir(baseDir)
      const name = file.replace(normalisedDir, '')

      return { name, body }
    }))

  const [root, appData] = await Promise.all([
    readAll(logFiles, dir),
    readAll(appDataFiles, appDataPath),
  ])

  return { appData, root }
}

const generate = async dir => {
  const version = await getVersion(dir)

  const managedFilter = [
    '0Harmony.dll',
    'Assembly-CSharp.dll',
    'Assembly-CSharp-firstpass.dll',
  ]

  const [
    Plugins,
    DataManaged,
    DataPlugins,
    CustomAvatars,
    CustomPlatforms,
    CustomSabers,
    rootFiles,
  ] = await Promise.all([
    getFiles(path.join(dir, 'Plugins')),
    getFiles(path.join(dir, 'Beat Saber_Data', 'Managed'), { filter: managedFilter }),
    getFiles(path.join(dir, 'Beat Saber_Data', 'Plugins')),
    getFiles(path.join(dir, 'CustomAvatars')),
    getFiles(path.join(dir, 'CustomPlatforms')),
    getFiles(path.join(dir, 'CustomSabers')),
    getFiles(dir, { recursive: false }),
  ])

  const tree = {
    'Beat Saber_Data': {
      Managed: DataManaged,
      Plugins: DataPlugins,
    },
    CustomAvatars,
    CustomPlatforms,
    CustomSabers,
    Plugins,
  }

  for (const [k, v] of Object.entries(rootFiles)) {
    tree[k] = v
  }

  const sections = [
    { title: 'Directory Structure', content: render(version, tree) },
  ]

  return sections
    .map(({ title, content }) => {
      const padded = content
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n')

      return `--- ${title} --- \n${padded}\n`
    })
    .join('\n')
}

module.exports = { generate }
