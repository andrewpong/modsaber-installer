const path = require('path')
const Registry = require('winreg')
const log = require('electron-log')
const Store = require('electron-store')
const fse = require('../utils/file.js')
const { checkPiracy } = require('./piracy.js')
const { BEAT_SABER_EXE, STEAM_APP_ID } = require('../constants.js')
const store = new Store()

/**
 * @typedef {('steam'|'oculus'|'unknown')} Platform
 */

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

    return resolve([baseDir, ...libraries])
  })
})

/**
 * Find a Steam game install path by App ID
 * @param {string} appID Steam App ID
 * @returns {Promise.<{ found: boolean, path: string, manifest: string }>}
 */
const findSteam = async appID => {
  try {
    const libraries = await findSteamLibraries()

    const manifests = await Promise.all(libraries.map(async library => {
      const test = path.join(library, `appmanifest_${appID}.acf`)
      const exists = await fse.exists(test)
      return { path: test, library, exists }
    }))

    const [manifest] = manifests
      .filter(x => x.exists)

    if (manifest === undefined) return { found: false, path: null, manifest: null }
    const manifestLines = await fse.readFile(manifest.path, 'utf8')

    const regex = /\s"installdir"\s+"(.+)"/
    const [installDir] = manifestLines.split('\n')
      .filter(line => line.match(regex))
      .map(line => regex.exec(line)[1].replace(/\\\\/g, '\\'))

    const final = { found: true, path: path.join(manifest.library, 'common', installDir), manifest: undefined }

    const depot = parseInt(appID, 10) + 1
    const manifestIdRx = new RegExp(`"${depot}"\\s+{\\s+"manifest"\\s+"(\\d+)"`, 'm')

    const manifestIdText = manifestIdRx.exec(manifestLines)
    if (manifestIdText && manifestIdText[1]) final.manifest = manifestIdText[1]

    return final
  } catch (err) {
    return { found: false, path: null, manifest: null }
  }
}

/**
 * Tests an install directory for the Beat Saber Executable
 * @param {string} installDir Install Directory
 * @returns {Promise.<{ path: string, valid: boolean, pirated: boolean, platform: Platform }>}
 */
const testPath = async installDir => {
  const valid = await fse.exists(path.join(installDir, BEAT_SABER_EXE))

  const lower = installDir.toLowerCase()
  const oculus = lower.includes('oculus') || lower.includes('hyperbolic-magnetism-beat-saber')

  const pirated = await checkPiracy(installDir)

  return { path: installDir, valid, pirated, platform: oculus ? 'oculus' : 'steam' }
}

/**
 * @returns {Promise.<{ found: boolean, path: string }>}
 */
const findOculus = () => new Promise(resolve => {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\WOW6432Node\\Oculus VR, LLC\\Oculus\\Config',
  })

  regKey.get('InitialAppLibrary', (err, key) => {
    if (err) return resolve({ found: false, path: null })

    const oculusPath = path.join(key.value, 'Software/hyperbolic-magnetism-beat-saber')
    return resolve({ found: true, path: oculusPath })
  })
})

/**
 * @returns {Promise.<{path: string, platform: Platform}>}
 */
const findPath = async () => {
  try {
    const prevPath = store.get('install.path')
    if (prevPath !== undefined) {
      const pathTest = await testPath(prevPath)
      if (pathTest.valid) return pathTest
    }

    const steamPath = await findSteam(STEAM_APP_ID)
    if (steamPath.found) {
      const pathTest = await testPath(steamPath.path)
      if (pathTest.valid) return pathTest
    }

    const oculusPath = await findOculus()
    if (oculusPath.found) {
      const pathTest = await testPath(oculusPath.path)
      if (pathTest.valid) return pathTest
    }
  } catch (err) {
    // Do nothing
    log.error(err)
  }

  return { path: null, platform: 'unknown' }
}

module.exports = { findSteam, findOculus, testPath, findPath }
