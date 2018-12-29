const path = require('path')
const { BrowserWindow } = require('electron')
const { extractZip } = require('../remote/remote.js')
const fse = require('../utils/file.js')

/**
 * @param {Buffer} zip Song Zip Body
 * @param {string} key Song Key
 * @param {string} installDir Install Info
 * @param {BrowserWindow} win Window
 */
const installSong = async (zip, key, installDir, win) => {
  // Window Details
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  // Extract zip
  sender.send('set-status', { text: 'Extracting song...' })
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

    if (dir.includes('autosaves')) return undefined
    await fse.ensureDir(dir)

    return fse.writeFile(file.path, file.data)
  })

  // Flush all jobs and return
  await Promise.all(jobs)
  sender.send('set-status', { text: 'Song install complete!' })
  return undefined
}

module.exports = { installSong }
