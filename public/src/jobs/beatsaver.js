const path = require('path')
const fse = require('../utils/file.js')
const { findPath } = require('../logic/pathFinder.js')
const { extractZip, safeDownload } = require('../remote/remote.js')
const { inputType, fromHash, fromID } = require('../remote/beatsaver.js')

class BeatSaverError extends Error {
  constructor (message, title) {
    super(message)
    this.title = title || 'Song Download Error'
  }
}

const downloadSong = async input => {
  // Find install path
  const install = await findPath()
  if (install.platform === 'unknown') throw new BeatSaverError('Could not find your Beat Saber directory.\nRun the mod manager once first!')

  // Ensure CustomSongs exists
  const customSongs = path.join(install.path, 'CustomSongs')
  await fse.ensureDir(customSongs)

  // Validate input type
  const type = inputType(input)
  if (type === 'invalid') throw new BeatSaverError('Invalid Song ID / Hash!')

  // Download song zip
  const song = await (type === 'hash' ? fromHash(input) : fromID(input))
  const zip = await safeDownload(song.downloadUrl)
  if (zip.error) throw new BeatSaverError('Song Download Failed!')

  try {
    // Extract zip
    const files = await extractZip(zip.body, path.join(customSongs, song.key))

    // File Write Jobs
    const jobs = files.map(async file => {
      const { dir } = path.parse(file.path)
      await fse.ensureDir(dir)

      return fse.writeFile(file.path, file.data)
    })

    // Flush all jobs and return
    await Promise.all(jobs)
    return undefined
  } catch (err) {
    throw new BeatSaverError('Extraction Failure!')
  }
}

module.exports = { BeatSaverError, downloadSong }
