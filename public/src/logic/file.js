const fs = require('fs')
const mkdirp = require('mkdirp')
const { promisify } = require('util')

module.exports = {
  readFile: promisify(fs.readFile),
  writeFile: promisify(fs.writeFile),
  exists: promisify(fs.exists),
  ensureDir: promisify(mkdirp),
}
