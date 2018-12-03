const path = require('path')
const fse = require('./file.js')

/**
 * @param {string} installDir Install Path
 * @returns {Promise.<boolean>}
 */
const checkPiracy = async installDir => {
  const knownFiles = [
    'IGG-GAMES.COM.url',
    'GAMESTORRENT.CO.url',
    'SmartSteamEmu.ini',
    'Beat Saber_Data/Plugins/valve.ini',
    'Beat Saber_Data/Plugins/steam.ini',
    'Beat Saber_Data/Plugins/huhuvr.ini',
    'Beat Saber_Data/Plugins/ALI213.ini',
    'Beat Saber_Data/Plugins/HUHUVR_steam_api64.dll',
    'Beat Saber_Data/Plugins/BSteam crack.dll',
  ]

  const checks = knownFiles.map(async x => {
    const file = path.join(installDir, x)
    const exists = await fse.exists(file)

    return { file, exists }
  })

  const checked = await Promise.all(checks)
  return checked.some(x => x.exists === true)
}

module.exports = { checkPiracy }
