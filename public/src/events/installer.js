const { join, parse } = require('path')
const { exec } = require('child_process')
const { ipcMain, dialog, BrowserWindow } = require('electron')
const { get } = require('snekfetch')
const AdmZip = require('adm-zip')
const fse = require('../logic/file.js')
const { BEAT_SABER_EXE, IPA_EXE } = require('../constants.js')

ipcMain.on('install-mods', async ({ sender }, { mods, install }) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  // Invalid install path
  if (install.platform === 'unknown' || !install.valid) return sender.send('set-status', { text: 'Invalid install path!', status: 'complete' })

  // Ensure UserData directory exists
  await fse.ensureDir(join(install.path, 'UserData'))

  // Send status
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

  const exePath = join(install.path, BEAT_SABER_EXE)
  const ipaPath = join(install.path, IPA_EXE)
  const canPatch = await fse.exists(exePath) && await fse.exists(ipaPath)

  if (!canPatch) {
    sender.send('set-status', { text: 'IPA Error!', status: 'complete' })

    return dialog.showMessageBox(window, {
      title: 'IPA Error',
      type: 'error',
      message: 'Could not patch Beat Saber (IPA Missing)',
    })
  }

  sender.send('set-status', { text: 'Patching game...' })

  exec(`"${ipaPath}" "${exePath}"`, err => {
    if (err) {
      sender.send('set-status', { text: 'IPA Error!', status: 'complete' })
      return dialog.showMessageBox(window, {
        title: 'IPA Error',
        type: 'error',
        message: 'Could not patch Beat Saber (IPA Error!)',
      })
    }

    sender.send('set-status', { text: 'Install complete!', status: 'complete' })
  })
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
