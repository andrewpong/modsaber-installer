const { BrowserWindow, shell } = require('electron')

/**
 * @param {Electron.BrowserWindow} window Window
 * @returns {void}
 */
const getAttention = window => {
  if (window.isFocused()) return undefined

  shell.beep()
  return window.flashFrame(true)
}

/**
 * @param {BrowserWindow} [win] Browser Window
 * @returns {{ window: BrowserWindow, sender: Electron.WebContents }}
 */
const getActiveWindow = win => {
  const window = win || BrowserWindow.getAllWindows()[0]
  const sender = window.webContents

  return { window, sender }
}

module.exports = { getAttention, getActiveWindow }
