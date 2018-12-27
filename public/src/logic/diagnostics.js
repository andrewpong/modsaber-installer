const path = require('path')
const treeify = require('treeify')
const { fetchByHash } = require('../remote/modsaber.js')
const { calculateHash } = require('../utils/helpers.js')
const fse = require('../utils/file.js')

/**
 * @param {string} root Root Title
 * @param {Object} tree Tree Object
 * @returns {string}
 */
const renderTree = (root, tree) => {
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
  const files = await fse.glob(globPath)

  /**
   * @type {Set<string>}
   */
  const allMods = new Set()

  const mapped = await Promise.all(files.map(async file => {
    const isFile = await fse.isFile(file)
    if (!isFile) return undefined

    const { base } = path.parse(file)
    if (options.filter !== undefined && !options.filter.includes(base)) return undefined

    const data = await fse.readFile(file)
    const hash = hashes ? await calculateHash(data) : null

    const normalised = file.replace(normalisedDir, '')
    if (hash === null) return { file: normalised, hash, modInfo: undefined }

    const mods = await fetchByHash(hash)
    if (mods.length === 0) return { file: normalised, hash, modInfo: undefined }
    const [mod] = mods

    const flags = []
    if (mods.length > 1) flags.push('Multiple')
    if (mod.approval.status === true) flags.push('Approved')
    else flags.push('Not Approved')
    flags.push(mod.gameVersion.value)

    const modDetails = `${mod.name}@${mod.version}`
    const modInfo = `${modDetails} // ${flags.join(', ')}`
    allMods.add(modDetails)

    return { file: normalised, hash, modInfo }
  }))

  const tree = resolveFiles(mapped)
  return { tree, mods: [...allMods.values()] }
}

/**
 * @param {{ file: string, hash: string, modInfo: string }[]} arr Input Array
 * @returns {Object}
 */
const resolveFiles = arr => {
  const final = {}
  for (const { file, hash, modInfo } of arr.filter(x => x !== undefined)) {
    const fileParts = file.split('/')
    let prev = final

    for (const idx in fileParts) {
      const i = parseInt(idx, 10)
      const part = fileParts[i]
      const last = i === fileParts.length - 1

      if (last) {
        const append = modInfo ? ` (${modInfo})` : ''
        const key = `${part}${append}`

        prev[key] = hash
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
    'CustomMenuText-default-2.1.1.txt',
    'dummy.txt',
    'songStatus.txt',
    'songStatusTemplate.txt',
    'MapperFeedHistory.txt',
  ]

  const logFiles = (await fse.glob(path.join(dir, '**', '*.{txt,log}')))
    .filter(file => {
      if (file.includes('CustomSongs')) return false

      const { base } = path.parse(file)
      if (blacklist.includes(base)) return false

      return true
    })

  const appDataPath = path.resolve(`${process.env.APPDATA}\\..\\LocalLow\\Hyperbolic Magnetism\\Beat Saber`)
  const appDataFiles = await fse.glob(path.join(appDataPath, '{output_log.txt,settings.cfg}'))

  /**
   * @param {string[]} files Files
   * @param {string} baseDir File Base Directory
   * @returns {Promise.<LogFile[]>}
   */
  const readAll = (files, baseDir) => Promise.all(files.map(async file => {
    const body = await fse.readFile(file, 'utf8')

    const normalisedDir = normaliseDir(baseDir)
    const name = file.replace(normalisedDir, '')

    return { name, body: body.length > 100000 ? 'File is greater than 100,000 characters!\nPlease check manually.' : body }
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
    'Newtonsoft.Json.dll',
    'System.Runtime.Serialization.dll',
  ]

  const [
    { tree: Plugins, mods: pluginsMods },
    { tree: DataManaged, mods: dataManagedMods },
    { tree: DataPlugins, mods: dataPluginsMods },
    { tree: CustomAvatars, mods: customAvatarsMods },
    { tree: CustomPlatforms, mods: customPlatformsMods },
    { tree: CustomSabers, mods: customSabersMods },
    { tree: rootFiles, mods: rootFilesMods },
    logFiles,
  ] = await Promise.all([
    getFiles(path.join(dir, 'Plugins')),
    getFiles(path.join(dir, 'Beat Saber_Data', 'Managed'), { filter: managedFilter }),
    getFiles(path.join(dir, 'Beat Saber_Data', 'Plugins')),
    getFiles(path.join(dir, 'CustomAvatars')),
    getFiles(path.join(dir, 'CustomPlatforms')),
    getFiles(path.join(dir, 'CustomSabers')),
    getFiles(dir, { recursive: false }),
    getLogFiles(dir),
  ])

  const allMods = [...new Set([
    ...pluginsMods,
    ...dataManagedMods,
    ...dataPluginsMods,
    ...customAvatarsMods,
    ...customPlatformsMods,
    ...customSabersMods,
    ...rootFilesMods,
  ])].sort((a, b) => a.localeCompare(b))

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
    { title: 'Directory Structure', content: renderTree(version, tree) },
    { title: 'Detected Mods Breakdown', content: allMods.join('\n') },
    ...logFiles.appData.map(({ name, body }) => ({ title: `AppData/${name}`, content: body })),
    ...logFiles.root.map(({ name, body }) => ({ title: `Beat Saber/${name}`, content: body })),
  ]

  return sections
    .map(({ title, content }) => {
      const padded = content
        .split('\n')
        .map((line, i, arr) => `${i === arr.length - 1 ? '──┘ ' : '  │ '}${line}`)
        .join('\n')

      return `──┬── ${title} \n${padded}\n`
    })
    .join('\n')
}

module.exports = { generate }
