import React, { Component } from 'react'
import semver from 'semver'
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
          selected: c.MODS_DEFAULT.includes(mod.name),
          requiredBy: c.MODS_REQUIRED.includes(mod.name) ? ['global'] : [],
        }

        return mod
      })

    this.setState({ filteredMods, selected: null })
  }

  toggleMod (index) {
    // Deep clone
    const mods = JSON.parse(JSON.stringify(this.state.filteredMods))
    const mod = mods[index]

    if (mod.install.requiredBy.length > 0) return undefined
    mod.install.selected = !mod.install.selected

    if (mod.install.selected) this.checkMod(mod, mods)
    else this.uncheckMod(mod, mods)

    mods[index] = mod
    this.setState({ filteredMods: mods })
  }

  checkMod (mod, mods) {
    const linkKeys = this.findLinks(mod, mods, true)
    for (const key of linkKeys) {
      const [name, version] = key.split('@')
      const i = mods.findIndex(x => x.name === name && x.version === version)
      const depMod = mods[i]

      depMod.install.requiredBy = [...depMod.install.requiredBy, this.modKey(mod)]

      mods[i] = depMod
    }

    return mods
  }

  uncheckMod (mod, mods) {
    const key = this.modKey(mod)
    const otherMods = mods.filter(x => x.install.requiredBy.includes(key))

    for (const otherModIdx in otherMods) {
      otherMods[otherModIdx].install.requiredBy =
        otherMods[otherModIdx].install.requiredBy.filter(x => x !== key)
    }

    return mods
  }

  modKey (mod) {
    return `${mod.name}@${mod.version}`
  }

  findLinks (mod, mods, keys = false) {
    const modsClone = JSON.parse(JSON.stringify(mods))
    const recursiveSearch = this.findLinksR(mod.links.dependencies, modsClone)
      .filter(x => x !== this.modKey(mod))

    if (keys) return recursiveSearch
    return recursiveSearch.map(key => {
      const [name, version] = key.split('@')
      return modsClone.find(x => x.name === name && x.version === version)
    })
  }

  findLinksR (dependencies, mods, li, ch) {
    const links = !li ? [] : [...li]
    const checked = !ch ? [] : [...ch]

    for (const link of dependencies) {
      const [name, range] = link.split('@')
      const search = mods.find(x => x.name === name && semver.satisfies(x.version, range))

      // Not satisfied
      if (!search) throw new Error()

      links.push(this.modKey(search))
      checked.push(link)

      const nestedDeps = search.links.dependencies.filter(x => !checked.includes(x))
      if (nestedDeps.length > 0) {
        const nested = this.findLinksR(nestedDeps, mods, links, checked)
        for (const n of nested) {
          if (!links.includes(n)) links.push(n)
        }
      }
    }

    return links
  }

  installMods () {
    const mods = [...this.state.filteredMods]
    const toInstall = mods.filter(mod => mod.install.selected || mod.install.requiredBy.length > 0 || false)
    console.log(toInstall.map(mod => `${mod.name}@${mod.version} // ${mod.details.author.name}`))
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
        installMods: () => { this.installMods() },

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
