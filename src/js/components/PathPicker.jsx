import React, { Component } from 'react'
import Context from '../Context.jsx'

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

  render () {
    return (
      <>
        <div className='field is-expanded has-addons'>
          <div className='control has-icons-left is-fullwidth'>
            <input
              type='text'
              className='input'
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
      </>
    )
  }
}

export default PathPicker
