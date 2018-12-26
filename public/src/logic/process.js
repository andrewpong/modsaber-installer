const { exec } = require('child_process')
const { BEAT_SABER_EXE } = require('../constants.js')

/**
 * @param {string} name Process Name
 * @returns {Promise.<boolean>}
 */
const isRunning = name => new Promise(resolve => {
  exec('tasklist', (err, stdout) => {
    if (err) return resolve(false)

    const processes = stdout.split('\n').filter(x => x.includes(name))
    return resolve(processes.length > 0)
  })
})

// Detect Beat Saber EXE
const beatSaberOpen = () => isRunning(BEAT_SABER_EXE)

module.exports = { isRunning, beatSaberOpen }
