const fs = require('fs')
const { promisify } = require('util')
const { ipcMain, dialog, clipboard, shell, BrowserWindow } = require('electron')
const log = require('electron-log')
const { runJob } = require('../jobs/job.js')
const { runDiagnostics } = require('../jobs/diagnostics.js')
const { uploadPaste } = require('../remote/paste.js')
const readFile = promisify(fs.readFile)

ipcMain.on('upload-log', async ({ sender }, logPath) => {
  // Get Browser Window
  const window = BrowserWindow.fromWebContents(sender)

  try {
    const userLog = await readFile(logPath, 'utf8')
    const url = await uploadPaste(userLog, 'log')

    clipboard.writeText(url)
    shell.openExternal(url)

    return sender.send('set-status', { text: 'Log file uploaded, copied URL to clipboard!' })
  } catch (err) {
    log.error(err)

    return dialog.showMessageBox(window, {
      type: 'error',
      title: 'Upload Error',
      message: 'Log file failed to upload!\nTry pressing CTRL+SHIFT+K',
    })
  }
})

ipcMain.on('run-diagnostics', async () => {
  // Run diagnostics job
  await runJob(runDiagnostics())
})
