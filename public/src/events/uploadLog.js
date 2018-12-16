const fs = require('fs')
const { promisify } = require('util')
const { ipcMain, dialog, clipboard, shell, BrowserWindow } = require('electron')
const log = require('electron-log')
const { post } = require('snekfetch')
const { USER_AGENT, HASTE_URL } = require('../constants.js')
const readFile = promisify(fs.readFile)

ipcMain.on('upload-log', async ({ sender }, logPath) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  try {
    const userLog = await readFile(logPath)
    const { body: { key } } = await post(`${HASTE_URL}/documents`)
      .set('User-Agent', USER_AGENT)
      .send(userLog)

    const url = `${HASTE_URL}/${key}.log`
    clipboard.writeText(url)
    shell.openExternal(url)

    sender.send('set-status', { text: 'Log file uploaded, copied URL to clipboard!' })
  } catch (err) {
    log.error(err)

    return dialog.showMessageBox(window, {
      type: 'error',
      title: 'Upload Error',
      message: 'Log file failed to upload!\nTry pressing CTRL+SHIFT+K',
    })
  }
})
