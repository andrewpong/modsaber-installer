const path = require('path')
const fse = require('../utils/file.js')
const { extractZip } = require('../remote/remote.js')
const { getActiveWindow } = require('../utils/window.js')

/**
 * @param {Buffer} zip Beatmap Zip Body
 * @param {string} key Beatmap Key
 * @param {string} installDir Install Info
 * @returns {Promise.<void>}
 */
const saveBeatmap = async (zip, key, installDir) => {
  // Window Details
  const { sender } = getActiveWindow()

  // Ensure CustomSongs and Playlists exists
  const customSongs = path.join(installDir, 'CustomSongs')
  await fse.ensureDir(customSongs)
  await fse.ensureDir(path.join(installDir, 'Playlists'))

  // Extract zip
  sender.send('set-status', { text: 'Extracting beatmap...' })
  const files = await extractZip(
    zip, path.join(installDir, 'CustomSongs', key),
    {
      filter: ['.json', '.ogg', '.wav', '.jpg', '.jpeg', '.png'],
      filterType: 'whitelist',
    }
  )

  // File Write Jobs
  const jobs = files.map(async file => {
    const { dir } = path.parse(file.path)

    // Strip out autosaves
    if (dir.includes('autosaves')) return undefined
    await fse.ensureDir(dir)

    return fse.writeFile(file.path, file.data)
  })

  // Flush all jobs and return
  await Promise.all(jobs)
  sender.send('set-status', { text: 'Beatmap install complete!' })
  return undefined
}

module.exports = { saveBeatmap }
