const { ipcMain } = require('electron')
const { findPath, testPath } = require('../logic/pathFinder.js')

ipcMain.on('get-install', async ({ sender }) => {
  const path = await findPath()
  sender.send('set-install', path)
})

ipcMain.on('set-install', async ({ sender }, installDir) => {
  const test = await testPath(installDir)
  if (test.valid) return sender.send('set-install', test)
  else return sender.send('invalid-install')
})
