const { join, parse } = require('path')
const { exec } = require('child_process')
const { ipcMain, dialog, shell, BrowserWindow } = require('electron')
const fse = require('../logic/file.js')
const { promiseHandler } = require('../logic/helpers.js')
const { downloadMod } = require('../logic/modsaber.js')
const { BEAT_SABER_EXE, IPA_EXE } = require('../constants.js')

const getAttention = window => {
  if (!window.isFocused()) {
    shell.beep()
    window.flashFrame(true)
  }
}

ipcMain.on('install-mods', async ({ sender }, data) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  /**
   * @type {any[]}
   */
  const mods = data.mods

  /**
   * @type {{ path: string, valid: boolean, platform: ('steam'|'oculus'|'unknown') }}
   */
  const install = data.install

  /**
   * @type {{ id: string, manifest: string, value: string }}
   */
  const gameVersion = data.gameVersion

  // Progress Values
  const USERDATA_PRG = 2
  const DL_PRG = 20
  const FILE_PRG_FACTOR = 2
  const FILE_PRG = data.mods.reduce((acc, mod) => {
    const files = install.platform === 'oculus' ? mod.files.oculus.files : mod.files.steam.files
    return acc + (Object.keys(files).length * FILE_PRG_FACTOR)
  }, 0)

  // Setup progress bar
  const maxProgress = USERDATA_PRG + DL_PRG + FILE_PRG
  let progress = 0
  window.setProgressBar(progress / maxProgress, { mode: 'normal' })

  // Invalid install path
  if (install.platform === 'unknown' || !install.valid) {
    window.setProgressBar(0, { mode: 'none' })
    return sender.send('set-status', { text: 'Invalid install path!', status: 'complete' })
  }

  // Ensure UserData directory exists
  await fse.ensureDir(join(install.path, 'UserData'))
  window.setProgressBar((progress += USERDATA_PRG) / maxProgress, { mode: 'normal' })

  // Check BeatSaberVersion.txt
  const versionTxt = join(install.path, 'BeatSaberVersion.txt')
  const versionTxtExists = await fse.exists(versionTxt)
  if (!versionTxtExists) await fse.writeFile(versionTxt, gameVersion.value)

  // Send status
  sender.send('set-status', { text: 'Downloading mods...', status: 'working' })

  const downloadJobs = Promise.all(mods.map(mod => downloadMod(mod, install.platform, install.path)))
  const { error: dlError, result: downloaded } = await promiseHandler(downloadJobs)

  if (dlError) {
    sender.send('set-status', { text: dlError.message, status: 'complete' })
    window.setProgressBar(0, { mode: 'none' })
    getAttention(window)

    return dialog.showMessageBox(window, {
      title: 'Download Error',
      type: 'error',
      message: `Download failed for ${dlError.mod.name}@${dlError.mod.version}\nError: ${dlError.message}`,
    })
  } else {
    window.setProgressBar((progress += DL_PRG) / maxProgress, { mode: 'normal' })
  }

  for (const idx in downloaded) {
    const mod = mods[idx]
    const modFiles = downloaded[idx]

    sender.send('set-status', { text: `Writing ${mod.name}@${mod.version}` })
    const jobs = modFiles.map(async file => {
      const { dir } = parse(file.path)
      await fse.ensureDir(dir)

      window.setProgressBar((progress += FILE_PRG_FACTOR) / maxProgress, { mode: 'normal' })
      return fse.writeFile(file.path, file.data)
    })

    await Promise.all(jobs) // eslint-disable-line
  }

  const exePath = join(install.path, BEAT_SABER_EXE)
  const ipaPath = join(install.path, IPA_EXE)
  const canPatch = await fse.exists(exePath) && await fse.exists(ipaPath)

  if (!canPatch) {
    sender.send('set-status', { text: 'IPA Error!', status: 'complete' })
    window.setProgressBar(0, { mode: 'none' })
    getAttention(window)

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
      window.setProgressBar(0, { mode: 'none' })
      getAttention(window)

      return dialog.showMessageBox(window, {
        title: 'IPA Error',
        type: 'error',
        message: 'Could not patch Beat Saber (IPA Error!)',
      })
    }

    getAttention(window)
    window.setProgressBar(1, { mode: 'none' })
    sender.send('set-status', { text: 'Install complete!', status: 'complete' })

    // Reset progress bar
    setTimeout(() => {
      window.setProgressBar(0, { mode: 'none' })
    }, 500)
  })
})
