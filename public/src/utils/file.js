const fs = require('fs')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const { promisify } = require('util')
const access = promisify(fs.access)
const stat = promisify(fs.stat)

/**
 * @param {fs.PathLike} path A path to a file. If a URL is provided, it must use the file: protocol.
 * URL support is experimental. If a file descriptor is provided, the underlying file will not be closed automatically.
 */
const exists = async path => {
  try {
    await access(path, fs.constants.F_OK)
    return true
  } catch (err) {
    if (err.code === 'ENOENT') return false
    else throw err
  }
}

/**
 * @param {fs.PathLike} path A path to a file. If a URL is provided, it must use the file: protocol.
 * URL support is experimental. If a file descriptor is provided, the underlying file will not be closed automatically.
 */
const isFile = async path => {
  const stats = await stat(path)
  return stats.isFile()
}

module.exports = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  access,
  stat,
  exists,
  isFile,
  copyFile: promisify(fs.copyFile),
  ensureDir: promisify(mkdirp),
  readDir: promisify(fs.readdir),
  rename: promisify(fs.rename),
  rmDir: promisify(rimraf),
  remove: promisify(fs.unlink),
  glob: promisify(require('glob')),
}
