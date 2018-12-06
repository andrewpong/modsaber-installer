import React, { Component } from 'react'
import Context from '../Context.jsx'

import { STATUS_WORKING, STATUS_LOADING, STATUS_OFFLINE } from '../constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { shell } = electron

class BottomBar extends Component {
  static contextType = Context

  handleModInfo () {
    const page = this.context.currentPage !== this.context.maxPages ?
      this.context.maxPages : 0

    return this.context.setCurrentPage(page)
  }

  render () {
    return (
      <>
        <span className='status'>
          { this.context.status === STATUS_OFFLINE ? 'Error' : 'Status' }: { this.context.statusText }
        </span>

        <button
          className='button'
          disabled={ this.context.install.pirated || this.context.selected === null }
          onClick={ () => this.handleModInfo() }
        >
          { this.context.currentPage !== this.context.maxPages ? 'View Selected Mod Info' : 'Go Back' }
        </button>

        {
          this.context.install.pirated ?
            <button className='button' onClick={ () => shell.openExternal('https://beatgames.com/') }>Buy the Game</button> :
            <button
              className='button'
              disabled={
                this.context.status === STATUS_WORKING ||
                this.context.status === STATUS_LOADING ||
                this.context.mods.length === 0
              }
              onClick={ () => { this.context.installMods() } }
            >
            Install / Update
            </button>
        }
      </>
    )
  }
}

export default BottomBar
