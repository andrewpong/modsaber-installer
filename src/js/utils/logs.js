import path from 'path'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron
const { app, shell } = electron.remote

/**
 * @type {import("fs")}
 */
const fs = electron.remote.require('fs')

// Constant log path
const logPath = path.join(app.getPath('userData'), 'log.log')

/**
 * @returns {Promise.<boolean>}
 */
const logExists = () => new Promise(resolve => {
  fs.exists(logPath, exists => resolve(exists))
})

export const openLog = async () => {
  const exists = await logExists()

  if (exists) return shell.openItem(logPath)
  else return shell.beep()
}

export const uploadLog = async () => {
  const exists = await logExists()

  if (exists) return ipcRenderer.send('upload-log', logPath)
  else return shell.beep()
}
