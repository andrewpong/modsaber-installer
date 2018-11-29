const { ipcMain } = require('electron')
const { findPath, testPath } = require('../logic/pathFinder.js')

ipcMain.on('get-path', async ({ sender }) => {
  const path = await findPath()
  sender.send('set-path', path)
})

ipcMain.on('set-path', async ({ sender }, installDir) => {
  const test = await testPath(installDir)
  if (test.valid) return sender.send('set-path', test)
  else return sender.send('invalid-path')
})
