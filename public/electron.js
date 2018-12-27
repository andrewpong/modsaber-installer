const path = require('path')
const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const isDev = require('electron-is-dev')
const { handleSchema } = require('./src/events/args.js')
const { enqueueJob, dequeueJob } = require('./src/logic/queue.js')
const { BASE_URL, VERSION, AUTO_UPDATE_JOB } = require('./src/constants.js')

// Event Handlers
require('./src/events/path.js')
require('./src/events/remote.js')
require('./src/events/installer.js')
require('./src/events/diagnostics.js')

// Instance Lock
const instanceLock = app.requestSingleInstanceLock()
if (!instanceLock) app.quit()

// Setup Auto Updater
autoUpdater.autoDownload = false

/**
 * @type {BrowserWindow}
 */
let window

app.on('ready', () => {
  const updateCheck = async () => {
    if (isDev) return false
    else return (await autoUpdater.checkForUpdates()).cancellationToken !== undefined
  }

  const hasUpdate = updateCheck()

  const width = 820
  const height = 590
  window = new BrowserWindow({
    width: width,
    height: isDev ? height + 20 : height,
    minWidth: width,
    minHeight: isDev ? height + 20 : height,
    show: false,
    icon: path.join(__dirname, 'icon.png'),
  })

  const menu = !isDev ? null : Menu.buildFromTemplate([
    {
      label: 'Dev',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
      ],
    },
  ])
  window.setMenu(menu)

  const startURL = isDev ?
    'http://localhost:3000' :
    `file://${path.join(__dirname, '../build/index.html')}`
  window.loadURL(startURL)

  window.setTitle(`ModSaber Installer // v${VERSION}`)
  window.once('ready-to-show', async () => {
    if (await hasUpdate) {
      await enqueueJob(AUTO_UPDATE_JOB)
      autoUpdater.downloadUpdate()
    }

    window.show()
    handleArgs(process.argv, window)
  })

  window.on('focus', () => {
    window.flashFrame(false)
  })

  window.custom = { BASE_URL, AUTO_UPDATE_JOB }
})

app.on('second-instance', (event, argv) => {
  if (!window) return undefined
  handleArgs(argv, window)

  if (window.isMinimized()) window.restore()
  return window.focus()
})

/**
 * @param {string[]} argv Process Arguments
 * @param {BrowserWindow} w Window
 * @returns {void}
 */
const handleArgs = (argv, w) => {
  /**
   * @type {string}
   */
  const args = argv.filter((_, i) => !(i < (isDev ? 2 : 1)))

  // Ignore if no args are passed
  if (!args || args.length === 0) return undefined

  // Handle Schema
  if (args[0].startsWith('modsaber://')) return handleSchema(args[0], w)

  return undefined
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

autoUpdater.on('download-progress', ({ percent }) => {
  window.setProgressBar(percent / 100, { mode: 'normal' })
})

autoUpdater.on('update-downloaded', async () => {
  const button = dialog.showMessageBox(window, {
    type: 'info',
    buttons: ['Release Notes', 'OK'],
    title: 'Updater',
    message: 'A newer version has been downloaded.\n\nClick OK to install the update.\nThe program will restart with the update applied.',
  })

  if (button === 0) {
    const { provider: { options: { owner, repo } } } = await autoUpdater.getUpdateInfoAndProvider()
    const releases = `https://github.com/${owner}/${repo}/releases`

    shell.openExternal(releases)
  }

  autoUpdater.quitAndInstall(true, true)
})

autoUpdater.on('error', () => {
  dequeueJob(AUTO_UPDATE_JOB)
})
