const { join, parse } = require('path')
const { ipcMain } = require('electron')
const { get } = require('snekfetch')
const AdmZip = require('adm-zip')
const fse = require('../logic/file.js')

ipcMain.on('install-mods', async ({ sender }, { mods, install }) => {
  // Invalid install path
  if (install.platform === 'unknown' || !install.valid) return

  sender.send('set-status', { text: 'Downloading mods...', status: 'working' })

  /**
   * @type {string[]}
   */
  const URLs = mods.map(mod => install.platform === 'steam' ? mod.files.steam : mod.files.oculus)
    .map(x => x.url)

  const zips = await Promise.all(URLs.map(async url => {
    const { body } = await get(url)
    return body
  }))

  sender.send('set-status', { text: 'Extracting mods...' })
  const extracted = await Promise.all(zips.map(blob => extractZip(blob, install.path)))

  for (const idx in extracted) {
    const mod = mods[idx]
    const modFiles = extracted[idx]

    sender.send('set-status', { text: `Writing ${mod.name}@${mod.version}` })
    const jobs = modFiles.map(async file => {
      const { dir } = parse(file.path)
      await fse.ensureDir(dir)

      return fse.writeFile(file.path, file.data)
    })

    await Promise.all(jobs) // eslint-disable-line
  }

  sender.send('set-status', { text: 'Finished installing!', status: 'complete' })
})

/**
 * @param {Buffer} blob Zip Blob
 * @param {string} installDir Install Directory
 * @returns {Promise.<{ path: string, data: Buffer }[]>}
 */
const extractZip = async (blob, installDir) => {
  const zip = new AdmZip(blob)

  const entries = zip.getEntries().map(entry => new Promise(resolve => {
    if (entry.isDirectory) resolve(null)

    entry.getDataAsync(data => resolve({ path: join(installDir, entry.entryName), data }))
  }))

  const data = await Promise.all(entries)
  return data.filter(x => x !== null)
}
