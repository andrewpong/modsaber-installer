import path from 'path'
import Mousetrap from 'mousetrap'

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

// Open log file
Mousetrap.bind('ctrl+shift+k', () => {
  fs.exists(logPath, exists => {
    if (exists) return shell.openItem(logPath)
    else return shell.beep()
  })
})

// Upload log file
Mousetrap.bind('ctrl+shift+l', () => {
  fs.exists(logPath, exists => {
    if (exists) return ipcRenderer.send('upload-log', logPath)
    else return shell.beep()
  })
})

// Run Diagnostics
Mousetrap.bind('ctrl+shift+d', () => ipcRenderer.send('run-diagnostics'))
