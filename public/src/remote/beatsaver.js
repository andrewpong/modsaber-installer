const path = require('path')
const { get } = require('snekfetch')
const { BrowserWindow, dialog } = require('electron')
const fse = require('../utils/file.js')
const { findPath } = require('../logic/pathFinder.js')
const { extractZip, safeDownload } = require('./remote.js')

const fromID = async id => (await get(`https://beatsaver.com/api/songs/detail/${id}`)).body.song
const fromHash = async hash => (await get(`https://beatsaver.com/api/songs/search/hash/${hash}`)).body.songs[0]

const inputType = input => {
  const idRx = /^(?:[0-9]{1,5})-(?:[0-9]{1,5})$/g
  const hashRx = /^[a-f0-9]{32}$/i

  return idRx.test(input) ?
    'id' :
    hashRx.test(input) ?
      'hash' :
      'invalid'
}

const downloadSong = async input => {
  const win = BrowserWindow.getAllWindows()[0]

  const install = await findPath()
  if (path.platform === 'unknown') {
    return dialog.showMessageBox(win, {
      type: 'error',
      title: 'Song Download Error',
      message: 'Could not find your Beat Saber directory.\n' +
        'Run the mod manager once first!',
    })
  }

  const customSongs = path.join(install.path, 'CustomSongs')
  await fse.ensureDir(customSongs)

  const type = inputType(input)
  if (type === 'invalid') {
    return dialog.showMessageBox(win, {
      type: 'error',
      title: 'Song Download Error',
      message: 'Invalid Song ID / Hash',
    })
  }

  try {
    const song = await (type === 'hash' ? fromHash(input) : fromID(input))
    const zip = await safeDownload(song.downloadUrl)

    if (zip.error) {
      return dialog.showMessageBox(win, {
        type: 'error',
        title: 'Song Download Error',
        message: 'Download Error!',
      })
    }

    const files = await extractZip(zip.body, path.join(customSongs, song.key))
    const jobs = files.map(async file => {
      const { dir } = path.parse(file.path)
      await fse.ensureDir(dir)

      return fse.writeFile(file.path, file.data)
    })

    await Promise.all(jobs)
    return undefined
  } catch (err) {
    return dialog.showMessageBox(win, {
      type: 'error',
      title: 'Song Download Error',
      message: 'Invalid Song ID / Hash',
    })
  }
}

module.exports = { downloadSong }
