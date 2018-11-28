const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const Registry = require('winreg')

const fse = {
  readFile: promisify(fs.readFile),
  exists: promisify(fs.exists),
}

/**
 * @returns {Promise.<string[]>}
 */
const findSteamLibraries = () => new Promise((resolve, reject) => {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\WOW6432Node\\Valve\\Steam',
  })

  regKey.get('InstallPath', async (err, key) => {
    if (err) return reject(err)

    const baseDir = path.join(key.value, 'steamapps')
    const libraryfolders = await fse.readFile(path.join(baseDir, 'libraryfolders.vdf'), 'utf8')

    const regex = /\s"\d"\s+"(.+)"/
    const libraries = libraryfolders.split('\n')
      .filter(line => line.match(regex))
      .map(line => regex.exec(line)[1].replace(/\\\\/g, '\\'))
      .map(line => path.join(line, 'steamapps'))

    resolve([baseDir, ...libraries])
  })
})

/**
 * Find a Steam game install path by App ID
 * @param {string} appID Steam App ID
 * @returns {string}
 */
const findSteam = async appID => {
  const libraries = await findSteamLibraries()

  const manifests = await Promise.all(libraries.map(async library => {
    const test = path.join(library, `appmanifest_${appID}.acf`)
    const exists = await fse.exists(test)
    return { path: test, library, exists }
  }))

  const [manifest] = manifests
    .filter(x => x.exists)

  if (manifest === undefined) return null
  const manifestLines = await fse.readFile(manifest.path, 'utf8')

  const regex = /\s"installdir"\s+"(.+)"/
  const [installDir] = manifestLines.split('\n')
    .filter(line => line.match(regex))
    .map(line => regex.exec(line)[1].replace(/\\\\/g, '\\'))

  return path.join(manifest.library, 'common', installDir)
}

/**
 * Tests an install directory for the Beat Saber Executable
 * @param {string} installDir Install Directory
 * @returns {Promise.<boolean>}
 */
const testPath = async installDir => {
  const executable = 'Beat Saber.exe'
  const test = await fse.exists(path.join(installDir, executable))

  return test
}

/**
 * @returns {Promise.<{path: string, platform: ('steam'|'oculus'|'unknown')}>}
 */
const findPath = async () => {
  const steamPath = await findSteam('620980')
  if (steamPath) {
    const pathTest = await testPath(steamPath)
    if (pathTest) return { path: steamPath, platform: 'steam' }
  }

  return { path: null, platform: 'unknown' }
}

module.exports = { findSteamLibraries, findSteam, testPath, findPath }
