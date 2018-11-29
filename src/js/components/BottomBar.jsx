import React, { Component } from 'react'
import Context from '../Context.jsx'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { shell } = electron

class BottomBar extends Component {
  static contextType = Context

  render () {
    const mod = this.context.filteredMods[this.context.selected]
    const modInfo = mod && `https://www.modsaber.org/mod/${mod.name}/${mod.version}`

    return (
      <>
        <span className='status'>Status: { this.context.statusText }</span>

        <button
          className='button'
          disabled={ this.context.selected === null }
          onClick={ () => {
            if (!modInfo) return undefined
            else shell.openExternal(modInfo)
          } }
        >
          View Selected Mod Info
        </button>
        <button className='button'>Install / Update</button>
      </>
    )
  }
}

export default BottomBar
