import React, { Component } from 'react'
import Context from '../Context.jsx'

import * as c from '../constants.js'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron
const { dialog } = electron.remote

class PathPicker extends Component {
  static contextType = Context

  componentDidMount () {
    ipcRenderer.on('invalid-path', () => {
      dialog.showMessageBox({
        title: 'Invalid Path',
        type: 'error',
        message: "The directory you selected doesn't contain Beat Saber.exe!\nPlease try again.",
      }, () => { this.openDialog() })
    })

    ipcRenderer.on('unknown-path', () => {
      dialog.showMessageBox({
        title: 'Unknown Install Directory',
        type: 'error',
        message: 'We could not automatically find your Beat Saber install folder.\nPlease select it manually.',
      }, () => { this.openDialog() })
    })
  }

  openDialog () {
    dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: this.context.install.path || undefined,
    }, paths => {
      if (paths === undefined) return
      const [path] = paths
      ipcRenderer.send('set-path', path)
    })
  }

  switchVersion (gv) {
    const gameVersions = JSON.parse(JSON.stringify(this.context.gameVersions))
      .map(x => {
        delete x.selected
        return x
      })

    const idx = gameVersions.findIndex(x => x.manifest === gv.manifest)
    this.context.filterMods(idx)
  }

  render () {
    return (
      <>
        <div className='field is-expanded has-addons' style={{ flexGrow: 1 }}>
          <div className='control has-icons-left is-fullwidth'>
            <input
              type='text'
              className='input monospaced'
              readOnly
              value={ this.context.install.path || '' }
            />

            <span className='icon is-left'>
              <i className='far fa-folder-open'></i>
            </span>
          </div>

          <div className='control'>
            <button className='button' onClick={ () => { this.openDialog() }}>
              ..
            </button>
          </div>
        </div>

        <div className='select' style={{ marginLeft: '10px' }} onChange={ e => { this.switchVersion(JSON.parse(e.target.value)) } }>
          <select disabled={ this.context.status === c.STATUS_WORKING || this.context.status === c.STATUS_LOADING }>
            { this.context.gameVersions.map((gv, i) =>
              <option value={ JSON.stringify(gv) } selected={ gv.selected } key={ i }>
                { gv.value }
              </option>)
            }
          </select>
        </div>
      </>
    )
  }
}

export default PathPicker
