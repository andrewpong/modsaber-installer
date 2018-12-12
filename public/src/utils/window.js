const { shell } = require('electron')

/**
 * @param {Electron.BrowserWindow} window Window
 * @returns {void}
 */
const getAttention = window => {
  if (window.isFocused()) return undefined

  shell.beep()
  window.flashFrame(true)
}

module.exports = { getAttention }
