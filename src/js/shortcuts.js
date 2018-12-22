import Mousetrap from 'mousetrap'
import { openLog, uploadLog } from './utils/logs.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron

// Open log file
Mousetrap.bind('ctrl+shift+k', () => openLog())

// Upload log file
Mousetrap.bind('ctrl+shift+l', () => uploadLog())

// Run Diagnostics
Mousetrap.bind('ctrl+shift+d', () => ipcRenderer.send('run-diagnostics'))
