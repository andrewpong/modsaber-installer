const { dialog } = require('electron')
const isDev = require('electron-is-dev')

/**
 * @param {string[]} argv Process Args
 * @returns {void}
 */
const handleArgs = argv => {
  /**
   * @type {string}
   */
  const schema = argv[isDev ? 2 : 1]

  // Ignore if schema url is not passed
  if (!schema.startsWith('modsaber://')) return undefined

  dialog.showMessageBox({
    title: 'Schema Trigger',
    type: 'info',
    message: schema,
  }, () => {
    // Async
  })
}

module.exports = { handleArgs }
