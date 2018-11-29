import React, { Component } from 'react'
import PropTypes from 'prop-types'

import * as c from './constants.js'

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
      statusText: c.STATUS_TEXT_IDLE,
      install: { path: null, platform: 'unknown' },
      status: c.STATUS_LOADING,

      mods: [],
      gameVersions: [],
      filteredMods: [],

      selected: null,
    }

    ipcRenderer.on('set-install', (_, install) => this.setState({ install }))
    ipcRenderer.on('set-remote', (_, { status, mods, gameVersions }) => {
      if (status === 'error') return this.setState({ statusText: c.STATUS_TEXT_OFFLINE, status: c.STATUS_OFFLINE })

      this.setState({
        statusText: c.STATUS_TEXT_LOADED,
        status: c.STATUS_LOADED,
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
        mod.meta.category = mod.meta.category || c.CATEGORY_DEFAULT
        return mod
      })
      .map(mod => {
        mod.install = {
          selected: c.MODS_REQUIRED.includes(mod.name) || c.MODS_DEFAULT.includes(mod.name),
          locked: c.MODS_REQUIRED.includes(mod.name),
        }

        return mod
      })

    this.setState({ filteredMods, selected: null })
  }

  toggleMod (index) {
    const mods = [...this.state.filteredMods]
    const mod = JSON.parse(JSON.stringify(mods[index]))

    if (mod.install.locked) return undefined
    mod.install.selected = !mod.install.selected

    mods[index] = mod
    this.setState({ filteredMods: mods })
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
        toggleMod: index => { this.toggleMod(index) },

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
