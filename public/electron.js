const path = require('path')
const { app, BrowserWindow, dialog, Menu } = require('electron')
const { autoUpdater } = require('electron-updater')
const isDev = require('electron-is-dev')
const { handleArgs } = require('./src/events/schema.js')
const { enqueueJob, dequeueJob } = require('./src/logic/queue.js')
const { BASE_URL, VERSION, AUTO_UPDATE_JOB } = require('./src/constants.js')

// Event Handlers
require('./src/events/path.js')
require('./src/events/remote.js')
require('./src/events/installer.js')
require('./src/events/uploadLog.js')

// Instance Lock
const instanceLock = app.requestSingleInstanceLock()
if (!instanceLock) return app.quit()

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

  const width = 800
  const height = 580
  window = new BrowserWindow({
    width: width,
    height: isDev ? height + 20 : height,
    minWidth: width,
    minHeight: isDev ? height + 20 : height,
    show: false,
    icon: path.join(__dirname, 'icon.png'),
  })

  const menu = !isDev ? null : new Menu.buildFromTemplate([ // eslint-disable-line
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
  window.focus()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

autoUpdater.on('download-progress', ({ percent }) => {
  window.setProgressBar(percent / 100, { mode: 'normal' })
})

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(window, {
    type: 'info',
    buttons: [],
    title: 'Updater',
    message: 'A newer version has been downloaded.\n\nClick OK to install the update.\nThe program will restart with the update applied.',
  })

  autoUpdater.quitAndInstall(true, true)
})

autoUpdater.on('error', () => {
  dequeueJob(AUTO_UPDATE_JOB)
})
