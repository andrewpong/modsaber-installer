const fse = require('../utils/file.js')
const { runJob } = require('../jobs/job.js')
const { downloadSong } = require('../jobs/beatsaver.js')
const { downloadPlaylist } = require('../jobs/playlist.js')
const { handleCustomFile, handleBeatmap } = require('../jobs/customFile.js')

/**
 * @param {string} schema Process Args
 * @returns {void}
 */
const handleSchema = schema => {
  // Ignore if schema url is not passed
  if (!schema || !schema.startsWith('modsaber://')) return undefined

  // Split protocol up into parts
  const [job, ...args] = schema.replace(/^modsaber:\/\//g, '').split('/')

  // Handle BeatSaver Downloads
  if (job === 'song') runJob(downloadSong(args[0]))

  // Handle BeatSaver Downloads
  if (job === 'playlist') runJob(downloadPlaylist(args.join('/')))

  // Handle model downloads
  if (['avatar', 'saber', 'platform'].includes(job)) runJob(handleCustomFile(args.join('/'), true))

  // Return if nothing else
  return undefined
}

/**
 * @param {string} filePath File Path
 * @param {string} ext File Extension
 * @returns {void}
 */
const handleFiles = async (filePath, ext) => {
  // Ensure the file actually exists
  const exists = await fse.exists(filePath)
  if (!exists) return undefined

  const job = ext === '.bmap' ?
    handleBeatmap(filePath) :
    handleCustomFile(filePath)

  return runJob(job)
}

module.exports = { handleSchema, handleFiles }
