const { BrowserWindow } = require('electron')
const { runJob } = require('../jobs/job.js')
const { downloadSong } = require('../jobs/beatsaver.js')
const { downloadPlaylist } = require('../jobs/playlist.js')

/**
 * @param {string} schema Process Args
 * @param {BrowserWindow} win Browser Window
 * @returns {void}
 */
const handleSchema = (schema, win) => {
  /**
   * @type {BrowserWindow}
   */
  const window = win || BrowserWindow.getAllWindows()[0]

  // Ignore if schema url is not passed
  if (!schema || !schema.startsWith('modsaber://')) return undefined

  // Split protocol up into parts
  const [job, ...args] = schema.replace(/^modsaber:\/\//g, '').split('/')

  // Handle BeatSaver Downloads
  if (job === 'song') runJob(downloadSong(args[0], window), window)

  // Handle BeatSaver Downloads
  if (job === 'playlist') runJob(downloadPlaylist(args.join('/'), window), window)

  // Return if nothing else
  return undefined
}

module.exports = { handleSchema }
