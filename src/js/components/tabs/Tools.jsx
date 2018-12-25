import React, { Component } from 'react'
import Helmet from 'react-helmet'
import Context from '../../Context.jsx'
import { openLog, uploadLog } from '../../utils/logs.js'
import * as c from '../../constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron

class Tools extends Component {
  static contextType = Context

  toggleTheme () {
    const theme = this.context.theme === 'dark' ? 'light' : 'dark'
    this.context.setTheme(theme)
  }

  render () {
    const working = this.context.jobs.length > 0
    const disabled = working || this.context.status === c.STATUS_LOADING

    return (
      <>
        <Helmet>
          <style>
            { `div.box#main { justify-content: initial; align-items: initial; padding: 15px; padding-top: 8px; overflow-y: scroll; }` }
          </style>
        </Helmet>

        <div className='content tools'>
          <h1>Theme</h1>
          <button className='button' onClick={ () => this.toggleTheme() }>Activate { this.context.theme === 'dark' ? 'Light' : 'Dark' } Theme</button>

          <hr />
          <h1>Diagnostics</h1>
          <button className={ `button${working ? ' is-loading' : ''}` } disabled={ disabled }
            onClick={ () => ipcRenderer.send('run-diagnostics') }>Run Diagnostics</button>
          <button className={ `button${working ? ' is-loading' : ''}` } disabled={ disabled }
            onClick={ () => ipcRenderer.send('patch-game', this.context.install) }>Patch Game</button>

          <hr />
          <h1>ModSaber Installer Log</h1>
          <button className='button' onClick={ () => openLog() }>Open Log</button>
          <button className='button' onClick={ () => uploadLog() }>Upload Log</button>
        </div>
      </>
    )
  }
}

export default Tools
