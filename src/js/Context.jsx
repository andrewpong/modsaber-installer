import React, { Component } from 'react'
import PropTypes from 'prop-types'

/**
 * @type {Electron}
 */
const electron = window.require('electron')
const { ipcRenderer } = electron

const Context = React.createContext()
const { Provider, Consumer } = Context

export class ControllerProvider extends Component {
  constructor (props) {
    super(props)

    this.state = {
      status: 'Idle',
      install: { path: null, platform: 'unknown' },
    }

    ipcRenderer.on('set-install', (_, install) => this.setState({ install }))
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  componentDidMount () {
    ipcRenderer.send('get-install')
  }

  render () {
    return (
      <Provider value={{
        status: this.state.status,
        install: this.state.install,

        setStatus: status => this.setState({ status }),
      }}>
        { this.props.children }
      </Provider>
    )
  }
}

export const Controller = Consumer
export default Context
