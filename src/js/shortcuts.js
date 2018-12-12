import path from 'path'
import Mousetrap from 'mousetrap'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { app, shell } = electron.remote

/**
 * @type {import("fs")}
 */
const fs = electron.remote.require('fs')

Mousetrap.bind('ctrl+shift+l', () => {
  const logPath = path.join(app.getPath('userData'), 'log.log')

  fs.exists(logPath, exists => {
    if (exists) return shell.openItem(logPath)
    else return shell.beep()
  })
})
