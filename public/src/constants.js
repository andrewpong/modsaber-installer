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
  BPM_EXE: 'Game.exe',
  STEAM_APP_ID: '620980',

  ERRORS: {
    INVALID_INSTALL_DIR: 'Could not find your Beat Saber directory.\nRun the mod manager once first!',
    CUSTOM_FILE_UNTRUSTED: 'For security reasons we do not allow custom files from untrusted sources!',
    DIAGNOSTICS_TOO_LARGE: 'Failed to upload diagnostics!\nReport is too big to upload.',
    DIAGNOSTICS_FAILURE: 'Failed to run diagnostics!\nError written to log file.',
  },

  REGISTERED_EXTS: [
    '.avatar',
    '.saber',
    '.plat',
    '.bmap',
    '.bplist',
  ],

  CUSTOM_FILE_DIRS: {
    '.avatar': 'CustomAvatars',
    '.saber': 'CustomSabers',
    '.plat': 'CustomPlatforms',
    '.bplist': 'Playlists',
  },

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
