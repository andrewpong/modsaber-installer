const { dialog } = require('electron')

/**
 * @param {string[]} argv Process Args
 */
const handleArgs = argv => {
  dialog.showMessageBox({
    title: 'Argv',
    type: 'info',
    message: JSON.stringify(argv, null, 2),
  })
}

module.exports = { handleArgs }
