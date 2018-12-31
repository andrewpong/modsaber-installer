const fse = require('../utils/file.js')
const { runJob } = require('../jobs/job.js')
const { beatSaverBeatmap, fileBeatmap } = require('../jobs/beatmap.js')
const { remotePlaylist, localPlaylist } = require('../jobs/playlist.js')
const { handleCustomFile } = require('../jobs/customFile.js')

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
  if (job === 'song') runJob(beatSaverBeatmap(args.join('/')))

  // Handle BeatSaver Downloads
  if (job === 'playlist') runJob(remotePlaylist(args.join('/')))

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
    fileBeatmap(filePath) :
    ext === '.bplist' ?
      localPlaylist(filePath) :
      handleCustomFile(filePath)

  return runJob(job)
}

module.exports = { handleSchema, handleFiles }
