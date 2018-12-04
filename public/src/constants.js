const VERSION = require('../../package.json').version
const BASE_URL = 'https://www.modsaber.org'

module.exports = {
  BASE_URL, API_URL: `${BASE_URL}/api/v1.1`,

  VERSION,
  USER_AGENT: `ModSaber Installer/${VERSION}`,

  IPA_EXE: 'IPA.exe',
  BEAT_SABER_EXE: 'Beat Saber.exe',
  STEAM_APP_ID: '620980',
}
