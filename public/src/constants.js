const VERSION = require('../../package.json').version
const BASE_URL = 'https://www.modsaber.org'

module.exports = {
  BASE_URL, API_URL: `${BASE_URL}/api/v1.1`,

  VERSION,
  USER_AGENT: `ModSaber Installer/${VERSION}`,
  HASTE_URL: 'https://paste.n3s.co',

  AUTO_UPDATE_JOB: 'update',

  IPA_EXE: 'IPA.exe',
  BEAT_SABER_EXE: 'Beat Saber.exe',
  STEAM_APP_ID: '620980',

  BLOCKED_EXTENSIONS: [
    '.jar',
    '.msi',
    '.com',
    '.bat',
    '.cmd',
    '.nt',
    '.scr',
    '.ps1',
    '.psm1',
    '.sh',
    '.bash',
    '.bsh',
    '.csh',
    '.bash_profile',
    '.bashrc',
    '.profile',
    '.zip',
    '.rar',
    '.tar.gz',
  ],
}
