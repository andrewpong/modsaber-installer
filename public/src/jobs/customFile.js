const path = require('path')
const { parse: parseURL } = require('url')
const { get } = require('snekfetch')
const fse = require('../utils/file.js')
const { JobError } = require('./job.js')
const { findPath } = require('../logic/pathFinder.js')
const { calculateHash } = require('../utils/helpers.js')
const { getActiveWindow } = require('../utils/window.js')
const { CUSTOM_FILE_DIRS } = require('../constants.js')

class CustomFileError extends JobError {
  constructor (message, status, title) {
    super(message, status, title)
    this.title = title || 'File Install Error'
  }
}

/**
 * @param {string} input Input path / URL
 * @param {boolean} [remote] Whether this is a URL
 */
const handleCustomFile = async (input, remote = false) => {
  // Window Details
  const { sender } = getActiveWindow()

  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new CustomFileError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Parse file info
  const { base, ext } = path.parse(input)

  if (!remote) {
    // Validate file exists
    const fileExists = await fse.exists(input)
    if (!fileExists) throw new CustomFileError(`Could not find file ${base}!`)
  } else {
    // Validate file is trustworthy
    const { hostname } = parseURL(input)
    if (hostname !== 'modelsaber.assistant.moe') {
      throw new CustomFileError('For security reasons we do not allow custom files from untrusted sources!')
    }
  }

  // Validate file type
  const dir = CUSTOM_FILE_DIRS[ext]
  if (dir === undefined) throw new CustomFileError(`File extension ${ext} not supported.`)

  // Read file
  const data = await getData(input, remote)

  // Create the directory if it doesn't exist
  const installDir = path.join(install.path, dir)
  const installPath = path.join(installDir, base)
  await fse.ensureDir(installDir)

  // Hash Compare
  if (await fse.exists(installPath)) {
    const currentData = await fse.readFile(installPath)
    const [currentHash, newHash] = await Promise.all([
      calculateHash(currentData),
      calculateHash(data),
    ])

    if (currentHash === newHash) throw new CustomFileError(`${base} is already installed!`)
  }

  // Write file
  await fse.writeFile(installPath, data)
  if (!remote) await fse.remove(input)

  // Set status
  sender.send('set-status', { text: `Installed ${base} successfully!` })
  return undefined
}

const getData = async (input, remote) => {
  if (!remote) return fse.readFile(input)

  const { body } = await get(input)
  return body
}

module.exports = { handleCustomFile }
