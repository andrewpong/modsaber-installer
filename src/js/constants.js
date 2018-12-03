/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { getCurrentWindow } = electron.remote

// Remote URLs
export const BASE_URL = getCurrentWindow().custom.BASE_URL

// Status Text
export const STATUS_TEXT_IDLE = 'Idle'
export const STATUS_TEXT_LOADING = 'Loading mods...'
export const STATUS_TEXT_OFFLINE = 'Could not connect to ModSaber'
export const STATUS_TEXT_LOADED = 'Mod list loaded'
export const STATUS_TEXT_PIRATED = 'Pirated copy detected'

// Statuses
export const STATUS_LOADING = 'loading'
export const STATUS_OFFLINE = 'offline'
export const STATUS_LOADED = 'loaded'
export const STATUS_WORKING = 'working'
export const STATUS_COMPLETE = 'complete'

// Required and Default Mods
export const MODS_REQUIRED = [
  'song-loader',
]
export const MODS_DEFAULT = [
  'scoresaber',
  'beatsaverdownloader',
]

// Other
export const CATEGORY_DEFAULT = 'Other'
