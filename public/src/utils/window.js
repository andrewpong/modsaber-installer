const { shell } = require('electron')

const getAttention = window => {
  if (window.isFocused()) return undefined

  shell.beep()
  window.flashFrame(true)
}

module.exports = { getAttention }
