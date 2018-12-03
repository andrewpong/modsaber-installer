import React, { Component } from 'react'
import Context from '../Context.jsx'

import { BASE_URL, STATUS_WORKING, STATUS_LOADING } from '../constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { shell } = electron

class BottomBar extends Component {
  static contextType = Context

  render () {
    const mod = this.context.mods[this.context.selected]
    const modInfo = mod && `${BASE_URL}/mod/${mod.name}/${mod.version}`

    return (
      <>
        <span className='status'>Status: { this.context.statusText }</span>

        <button
          className='button'
          disabled={ this.context.install.pirated || this.context.selected === null }
          onClick={ () => {
            if (!modInfo) return undefined
            else shell.openExternal(modInfo)
          } }
        >
          View Selected Mod Info
        </button>

        <button
          className='button'
          disabled={
            this.context.status === STATUS_WORKING ||
            this.context.status === STATUS_LOADING ||
            this.context.install.pirated ||
            this.context.mods.length === 0
          }
          onClick={ () => { this.context.installMods() } }
        >
          Install / Update
        </button>
      </>
    )
  }
}

export default BottomBar
