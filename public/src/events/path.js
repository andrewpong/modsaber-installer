const { ipcMain } = require('electron')
const Store = require('electron-store')
const { findPath, testPath } = require('../logic/pathFinder.js')
const store = new Store()

ipcMain.on('get-path', async ({ sender }) => {
  const path = await findPath()
  if (path.platform === 'unknown') sender.send('unknown-path')
  else sender.send('set-path', path)
})

ipcMain.on('set-path', async ({ sender }, installDir) => {
  const test = await testPath(installDir)
  if (!test.valid) return sender.send('invalid-path', test.path)

  store.set('install', test)
  return sender.send('set-path', test)
})
