const path = require('path')
const Registry = require('winreg')
const fse = require('./file.js')
const { checkPiracy } = require('./piracy.js')
const { BEAT_SABER_EXE, STEAM_APP_ID } = require('../constants.js')

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

    resolve([baseDir, ...libraries])
  })
})

/**
 * Find a Steam game install path by App ID
 * @param {string} appID Steam App ID
 * @returns {{ path: string, manifest: string }}
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

  const final = { path: path.join(manifest.library, 'common', installDir) }

  const depot = parseInt(appID, 10) + 1
  const manifestIdRx = new RegExp(`"${depot}"\\s+{\\s+"manifest"\\s+"(\\d+)"`, 'm')

  const manifestIdText = manifestIdRx.exec(manifestLines)
  if (manifestIdText && manifestIdText[1]) final.manifest = manifestIdText[1]

  return final
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

const findOculus = () => new Promise((resolve, reject) => {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\WOW6432Node\\Oculus VR, LLC\\Oculus\\Config',
  })

  regKey.get('InitialAppLibrary', (err, key) => {
    if (err) return reject(err)

    const oculusPath = path.join(key.value, 'Software/hyperbolic-magnetism-beat-saber')
    resolve(oculusPath)
  })
})

/**
 * @returns {Promise.<{path: string, platform: Platform}>}
 */
const findPath = async () => {
  try {
    const steamPath = await findSteam(STEAM_APP_ID)
    if (steamPath) {
      const pathTest = await testPath(steamPath.path)
      if (pathTest.valid) return pathTest
    }

    const oculusPath = await findOculus()
    if (oculusPath) {
      const pathTest = await testPath(oculusPath)
      if (pathTest.valid) return pathTest
    }
  } catch (err) {
    // Do nothing
    console.error(err)
  }

  return { path: null, platform: 'unknown' }
}

module.exports = { findSteam, findOculus, testPath, findPath }
