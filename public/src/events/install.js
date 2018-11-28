const { ipcMain } = require('electron')
const { findPath } = require('../logic/pathFinder.js')

ipcMain.on('get-install', async event => {
  const path = await findPath()
  event.sender.send('set-install', path)
})
