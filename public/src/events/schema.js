const { BrowserWindow, dialog } = require('electron')
const isDev = require('electron-is-dev')

/**
 * @param {string[]} argv Process Args
 * @param {BrowserWindow} win Browser Window
 * @returns {void}
 */
const handleArgs = (argv, win) => {
  /**
   * @type {string}
   */
  const schema = argv[isDev ? 2 : 1]

  /**
   * @type {BrowserWindow}
   */
  const window = win || BrowserWindow.getAllWindows()[0]

  // Ignore if schema url is not passed
  if (!schema.startsWith('modsaber://')) return undefined

  dialog.showMessageBox(window, {
    title: 'Schema Trigger',
    type: 'info',
    message: schema,
  }, () => {
    // Async
  })
}

module.exports = { handleArgs }
