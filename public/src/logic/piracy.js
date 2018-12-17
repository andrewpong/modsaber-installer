const path = require('path')
const { glob } = require('../utils/file.js')

/**
 * @param {string} installDir Install Path
 * @returns {Promise.<boolean>}
 */
const checkPiracy = async installDir => {
  const knownFiles = [
    'IGG-GAMES.COM.url',
    'GAMESTORRENT.CO.url',
    'SmartSteamEmu.ini',
    'Beat Saber_Data/Plugins/*.ini',
    'Beat Saber_Data/Plugins/HUHUVR_steam_api64.dll',
    'Beat Saber_Data/Plugins/BSteam crack.dll',
  ]

  const checks = knownFiles.map(async x => {
    const file = path.join(installDir, x)
    const files = await glob(file)

    const exists = files.length > 0
    return { file, exists }
  })

  const checked = await Promise.all(checks)
  return checked.some(x => x.exists === true)
}

module.exports = { checkPiracy }
