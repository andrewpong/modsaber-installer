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
      statusText: 'Idle',
      install: { path: null, platform: 'unknown' },
      status: 'loading',

      mods: [],
      gameVersions: [],
      filteredMods: [],

      selected: null,
    }

    ipcRenderer.on('set-install', (_, install) => this.setState({ install }))
    ipcRenderer.on('set-remote', (_, { status, mods, gameVersions }) => {
      if (status === 'error') return this.setState({ statusText: 'Could not connect to ModSaber', status: 'offline' })

      this.setState({
        statusText: 'Mod list loaded',
        status: 'loaded',
        mods,
        gameVersions,
      }, () => { this.filterMods() })
    })
  }

  static propTypes = {
    children: PropTypes.node.isRequired,
  }

  componentDidMount () {
    ipcRenderer.send('get-install')
    ipcRenderer.send('get-remote')
  }

  filterMods (index = 0) {
    const { mods, gameVersions } = this.state
    const gameVersion = gameVersions[index] || {}

    const filteredMods = mods
      .filter(mod => mod !== null)
      .filter(mod => mod.gameVersion.manifest === gameVersion.manifest)
      .map(mod => {
        mod.meta.category = mod.meta.category || 'Other'
        return mod
      })

    this.setState({ filteredMods, selected: null })
  }

  render () {
    return (
      <Provider value={{
        statusText: this.state.statusText,
        install: this.state.install,
        status: this.state.status,

        setStatusText: statusText => this.setState({ statusText }),

        mods: this.state.mods,
        gameVersions: this.state.gameVersions,
        filteredMods: this.state.filteredMods,

        selected: this.state.selected,
        setSelected: selected => this.setState({ selected }),
      }}>
        { this.props.children }
      </Provider>
    )
  }
}

export const Controller = Consumer
export default Context
